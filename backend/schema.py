from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    Column,
    Date,
    Enum,
    ForeignKey,
    Integer,
    MetaData,
    String,
    Table,
    and_,
    column,
    or_,
)

STAGES = {
    "new": ("新商機", 10),
    "qualified": ("已確認", 25),
    "proposal": ("提案", 50),
    "negotiation": ("議價", 75),
    "won": ("成交", 100),
    "lost": ("失單", 0),
}
CLOSED = ("won", "lost")
CONTACT_STATUSES = ("lead", "qualified", "customer")
MANUAL_KINDS = ("note", "call", "email")
MAX_SAFE_INTEGER = 2**53 - 1

metadata = MetaData()


def actor_columns():
    return [
        Column("created_by_id", String, nullable=False, server_default="sample"),
        Column("created_by_email", String, nullable=False, server_default="sample@example.test"),
        Column("updated_by_id", String, nullable=False, server_default="sample"),
        Column("updated_by_email", String, nullable=False, server_default="sample@example.test"),
    ]


companies = Table(
    "companies",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("name", String, nullable=False),
    Column("website", String),
    Column("industry", String),
    Column("notes", String),
    *actor_columns(),
    sqlite_autoincrement=True,
)
contacts = Table(
    "contacts",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("name", String, nullable=False),
    Column("company_id", ForeignKey(companies.c.id, ondelete="SET NULL"), index=True),
    Column("title", String),
    Column("email", String),
    Column("phone", String),
    Column("status", Enum(*CONTACT_STATUSES, native_enum=False, create_constraint=True), nullable=False),
    *actor_columns(),
    sqlite_autoincrement=True,
)
deals = Table(
    "deals",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("name", String, nullable=False),
    Column("company_id", ForeignKey(companies.c.id, ondelete="SET NULL"), index=True),
    Column("contact_id", ForeignKey(contacts.c.id, ondelete="SET NULL"), index=True),
    Column("stage", Enum(*STAGES, native_enum=False, create_constraint=True), nullable=False, index=True),
    Column("amount_cents", BigInteger().with_variant(Integer(), "sqlite"), nullable=False),
    Column("probability", Integer, nullable=False),
    Column("expected_close", Date),
    Column("actual_close", Date),
    Column("position", Integer, nullable=False),
    *actor_columns(),
    CheckConstraint(column("amount_cents").between(0, MAX_SAFE_INTEGER)),
    CheckConstraint(column("probability").between(0, 100)),
    CheckConstraint(
        or_(
            and_(column("stage").in_(CLOSED), column("actual_close").is_not(None)),
            and_(column("stage").not_in(CLOSED), column("actual_close").is_(None)),
        )
    ),
    sqlite_autoincrement=True,
)
activities = Table(
    "activities",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("contact_id", ForeignKey(contacts.c.id, ondelete="CASCADE"), index=True),
    Column("deal_id", ForeignKey(deals.c.id, ondelete="CASCADE"), index=True),
    Column("kind", Enum(*MANUAL_KINDS, "stage", native_enum=False, create_constraint=True), nullable=False),
    Column("content", String, nullable=False),
    Column("occurred_at", String, nullable=False),
    Column("follow_up", Date),
    Column("completed", Boolean, nullable=False, default=False),
    *actor_columns(),
    CheckConstraint(
        or_(
            and_(column("contact_id").is_not(None), column("deal_id").is_(None)),
            and_(column("contact_id").is_(None), column("deal_id").is_not(None)),
        )
    ),
    sqlite_autoincrement=True,
)
initialized = Table("initialized", metadata, Column("id", Integer, primary_key=True))
