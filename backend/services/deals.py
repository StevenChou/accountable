from sqlalchemy import select

from backend import clock
from backend.api.errors import invalid
from backend.auth import Actor
from backend.schema import CLOSED, STAGES, deals
from backend.services import activities
from backend.services.records import get_row


def lane_order(connection, stage):
    return list(
        connection.scalars(select(deals.c.id).where(deals.c.stage == stage).order_by(deals.c.position, deals.c.id))
    )


def write_order(connection, ids, actor: Actor):
    for position, deal_id in enumerate(ids):
        connection.execute(
            deals.update()
            .where(deals.c.id == deal_id, deals.c.position != position)
            .values(position=position, **actor.modification())
        )


def insert_deal(connection, values, actor: Actor):
    if values["stage"] in CLOSED:
        actual = values["actual_close"] or clock.today()
        if actual > clock.today():
            raise invalid("actual_close", "實際結案日不能晚於今天。")
        values["actual_close"] = actual
    else:
        values["actual_close"] = None
    order = lane_order(connection, values["stage"])
    deal_id = connection.execute(deals.insert().values(**values, position=0, **actor.creation())).inserted_primary_key[
        0
    ]
    write_order(connection, [deal_id, *order], actor)
    return deal_id


def stage_values(previous, target):
    actual_close = None
    if target in CLOSED:
        actual_close = previous["actual_close"] or clock.today()
    return {"stage": target, "probability": STAGES[target][1], "actual_close": actual_close}


def update_deal(connection, previous, values, actor: Actor):
    deal_id, target = previous["id"], values["stage"]
    values.update(actor.modification())
    if target == previous["stage"]:
        if target in CLOSED:
            if values["actual_close"] is None or values["actual_close"] > clock.today():
                raise invalid("actual_close", "請輸入今天或更早的實際結案日。")
        else:
            values["actual_close"] = None
        connection.execute(deals.update().where(deals.c.id == deal_id).values(**values))
        return

    source = lane_order(connection, previous["stage"])
    destination = lane_order(connection, target)
    values.update(stage_values(previous, target))
    connection.execute(deals.update().where(deals.c.id == deal_id).values(**values))
    write_order(connection, [deal_id, *destination], actor)
    write_order(connection, [item for item in source if item != deal_id], actor)
    activities.log_stage_change(connection, deal_id, previous["stage"], target, actor)


def move_deal(connection, deal_id, target, before_id, actor: Actor):
    previous = get_row(connection, deals, deal_id)
    source_stage = previous["stage"]
    source = lane_order(connection, source_stage)
    destination = source.copy() if source_stage == target else lane_order(connection, target)
    if before_id == deal_id and source_stage == target:
        return
    if deal_id in destination:
        destination.remove(deal_id)
    if before_id is not None and before_id not in destination:
        raise invalid("before_id", "目標位置已變更，請重新選擇卡片位置。")
    index = len(destination) if before_id is None else destination.index(before_id)
    destination.insert(index, deal_id)
    if source_stage == target:
        if source != destination:
            write_order(connection, destination, actor)
        return
    connection.execute(
        deals.update().where(deals.c.id == deal_id).values(**stage_values(previous, target), **actor.modification())
    )
    write_order(connection, destination, actor)
    write_order(connection, [item for item in source if item != deal_id], actor)
    activities.log_stage_change(connection, deal_id, source_stage, target, actor)
