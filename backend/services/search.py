from sqlalchemy import func, select
from sqlalchemy.engine import Connection

from backend.services.records import RECORDS

ASCII_LOWERCASE = str.maketrans("ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz")


def find_records(connection: Connection, query: str):
    text = query.strip().translate(ASCII_LOWERCASE)
    if not text:
        return []

    results = []
    for resource, table in RECORDS.items():
        name = table.c.name
        comparable = name.collate("C") if connection.dialect.name == "postgresql" else name
        matches = func.lower(comparable).contains(text, autoescape=True)
        rows = connection.execute(select(table.c.id, name).where(matches).order_by(table.c.id))
        results.extend({"resource": resource, "id": row.id, "name": row.name} for row in rows)
    return results
