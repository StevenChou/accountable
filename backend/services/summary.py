from sqlalchemy import select

from backend import clock
from backend.schema import CLOSED, STAGES, activities, deals
from backend.services.activities import activity_query, present_activity
from backend.services.records import present, record_query


def open_totals(records):
    open_deals = [record for record in records if record["stage"] not in CLOSED]
    weighted = sum(row["amount_cents"] * row["probability"] for row in open_deals)
    return {
        "count": len(open_deals),
        "amount_cents": sum(row["amount_cents"] for row in open_deals),
        "expected_cents": (weighted + 50) // 100,
    }


def pipeline(connection):
    today = clock.today()
    order = record_query(deals).order_by(deals.c.position, deals.c.id)
    records = [present(deals, row, today) for row in connection.execute(order).mappings()]
    lanes = []
    for stage in STAGES:
        cards = [row for row in records if row["stage"] == stage]
        lanes.append({"stage": stage, "cards": cards, "count": len(cards), "totals": open_totals(cards)})
    return {"totals": open_totals(records), "lanes": lanes}


def six_months(today):
    current_month = today.year * 12 + today.month - 1
    for period in range(current_month - 5, current_month + 1):
        year, month_index = divmod(period, 12)
        yield f"{year:04d}-{month_index + 1:02d}"


def follow_up_group(due, today):
    days = (due - today).days
    if days < 0:
        return "late"
    if days == 0:
        return "today"
    if days <= 7:
        return "soon"
    return "later"


def dashboard(connection):
    today = clock.today()
    records = list(connection.execute(select(deals)).mappings())
    recent_query = activity_query().order_by(activities.c.occurred_at.desc(), activities.c.id.desc()).limit(10)
    follow_up_query = activity_query().where(
        activities.c.follow_up.is_not(None), activities.c.completed.is_(False),
    ).order_by(activities.c.follow_up, activities.c.id)
    recent = [present_activity(row) for row in connection.execute(recent_query).mappings()]
    follow_ups = [
        {**present_activity(row), "group": follow_up_group(row["follow_up"], today)}
        for row in connection.execute(follow_up_query).mappings()
    ]

    months = {
        month: {"month": month, "count": 0, "amount_cents": 0}
        for month in six_months(today)
    }
    stage_amounts = dict.fromkeys(STAGES, 0)
    for record in records:
        stage = record["stage"]
        stage_amounts[stage] += record["amount_cents"]
        if stage == "won":
            month = record["actual_close"].isoformat()[:7]
            if month in months:
                months[month]["count"] += 1
                months[month]["amount_cents"] += record["amount_cents"]

    return {
        "today": today,
        "recent": recent,
        "follow_ups": follow_ups,
        "won": months[today.isoformat()[:7]],
        "open": open_totals(records),
        "months": list(months.values()),
        "stage_amounts": [{"stage": stage, "amount_cents": amount} for stage, amount in stage_amounts.items()],
    }
