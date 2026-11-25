from sqlalchemy import func, select

from backend import clock
from backend.api.errors import invalid, missing
from backend.schema import CLOSED, activities, companies, contacts, deals

RECORDS = {"companies": companies, "contacts": contacts, "deals": deals}


def get_row(connection, table, record_id: int):
    row = connection.execute(select(table).where(table.c.id == record_id)).mappings().first()
    if row is None:
        raise missing()
    return dict(row)


def validate_links(connection, values):
    for field, table, label in (
        ("company_id", companies, "公司"),
        ("contact_id", contacts, "聯絡人"),
    ):
        key = values.get(field)
        if key is not None and connection.scalar(select(table.c.id).where(table.c.id == key)) is None:
            raise invalid(field, f"找不到選取的{label}，請重新選擇。")


def record_query(table):
    if table is companies:
        return select(companies)
    if table is contacts:
        return select(contacts, companies.c.name.label("company_name")).select_from(contacts.outerjoin(companies))
    return select(
        deals,
        companies.c.name.label("company_name"),
        contacts.c.name.label("contact_name"),
    ).select_from(deals.outerjoin(companies).outerjoin(contacts, deals.c.contact_id == contacts.c.id))


def present(table, row, today):
    result = dict(row)
    if table is deals:
        closed = result["stage"] in CLOSED
        close = result["actual_close"] if closed else result["expected_close"]
        result.update(close_date=close, overdue=not closed and close is not None and close < today)
    return result


def list_records(connection, table):
    today = clock.today()
    return [
        present(table, row, today) for row in connection.execute(record_query(table).order_by(table.c.id)).mappings()
    ]


def detail(connection, table, record_id: int):
    row = connection.execute(record_query(table).where(table.c.id == record_id)).mappings().first()
    if row is None:
        raise missing()
    result = present(table, row, clock.today())
    if table is companies:
        for key, related in (("contacts", contacts), ("deals", deals)):
            result[key] = [
                dict(item)
                for item in connection.execute(
                    select(related.c.id, related.c.name)
                    .where(related.c.company_id == record_id)
                    .order_by(related.c.name, related.c.id)
                ).mappings()
            ]
    return result


def delete_impact(connection, table, record_id: int):
    get_row(connection, table, record_id)
    if table is companies:
        return {
            "contacts": connection.scalar(select(func.count()).where(contacts.c.company_id == record_id)),
            "deals": connection.scalar(select(func.count()).where(deals.c.company_id == record_id)),
        }
    owner = activities.c.contact_id if table is contacts else activities.c.deal_id
    owned = owner == record_id
    result = {
        "activities": connection.scalar(select(func.count()).where(owned)),
        "follow_ups": connection.scalar(
            select(func.count()).where(
                owned,
                activities.c.follow_up.is_not(None),
                activities.c.completed.is_(False),
            )
        ),
    }
    if table is contacts:
        result["deals"] = connection.scalar(select(func.count()).where(deals.c.contact_id == record_id))
    return result
