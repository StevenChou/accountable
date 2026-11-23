from datetime import UTC

from sqlalchemy import select

from backend import clock
from backend.api.errors import ApiError
from backend.schema import STAGES, activities, contacts, deals
from backend.services.records import get_row


def utc_text(value):
    return value.astimezone(UTC).isoformat(timespec="microseconds")


def activity_query():
    return select(
        activities, contacts.c.name.label("contact_name"), deals.c.name.label("deal_name"),
    ).select_from(
        activities.outerjoin(contacts, activities.c.contact_id == contacts.c.id)
        .outerjoin(deals, activities.c.deal_id == deals.c.id)
    )


def present_activity(row):
    activity = dict(row)
    if row["contact_id"] is None:
        activity.update(owner_type="deals", owner_id=row["deal_id"], owner_name=row["deal_name"])
    else:
        activity.update(owner_type="contacts", owner_id=row["contact_id"], owner_name=row["contact_name"])
    return activity


def timeline(connection, table, owner_id):
    get_row(connection, table, owner_id)
    owner = activities.c.contact_id if table is contacts else activities.c.deal_id
    query = activity_query().where(owner == owner_id).order_by(
        activities.c.occurred_at.desc(), activities.c.id.desc(),
    )
    return [present_activity(row) for row in connection.execute(query).mappings()]


def manual_activity(connection, activity_id):
    activity = get_row(connection, activities, activity_id)
    if activity["kind"] == "stage":
        raise ApiError(409, "系統產生的階段變更活動只能查看。")
    return activity


def manual_values(values):
    return {
        **values,
        "occurred_at": utc_text(values["occurred_at"] or clock.now()),
        "completed": values["completed"] and values["follow_up"] is not None,
    }


def log_stage_change(connection, deal_id, previous, target):
    connection.execute(activities.insert().values(
        deal_id=deal_id,
        kind="stage",
        content=f"從{STAGES[previous][0]}移至{STAGES[target][0]}",
        occurred_at=utc_text(clock.now()),
        completed=False,
    ))
