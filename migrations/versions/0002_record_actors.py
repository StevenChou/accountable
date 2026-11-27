"""Record who created and most recently modified each CRM record."""

from alembic import op
from sqlalchemy import Column, String

revision = "0002_record_actors"
down_revision = "0001_crm"


def upgrade():
    for name in ("companies", "contacts", "deals", "activities"):
        for role in ("created", "updated"):
            op.add_column(name, Column(f"{role}_by_id", String, nullable=False, server_default="sample"))
            op.add_column(
                name, Column(f"{role}_by_email", String, nullable=False, server_default="sample@example.test")
            )
