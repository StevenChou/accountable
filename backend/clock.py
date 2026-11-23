from datetime import UTC, date, datetime


def today() -> date:
    return date.today()


def now() -> datetime:
    return datetime.now(UTC)
