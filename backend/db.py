import os
from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import URL, create_engine, event, select, text
from sqlalchemy.engine import Connection, Engine

from backend.config import PROJECT_ROOT, Settings
from backend.schema import activities, companies, contacts, deals, initialized

DEFAULT_DB = PROJECT_ROOT / "data" / "accountable.sqlite3"
WEB_ROOTS = (PROJECT_ROOT / "frontend", PROJECT_ROOT / "node_modules")


def database_path() -> Path:
    supplied = os.environ.get("ACCOUNTABLE_DB_PATH")
    testing = os.environ.get("ACCOUNTABLE_TEST_MODE") == "1"
    if testing:
        root = os.environ.get("ACCOUNTABLE_TEST_ROOT")
        if not supplied or not root or not Path(supplied).is_absolute():
            raise RuntimeError("測試需要指定專用的暫存資料庫路徑。")
        path = Path(supplied).resolve()
        if path == Path(root).resolve() or not path.is_relative_to(Path(root).resolve()):
            raise RuntimeError("測試資料庫須位於本次測試的暫存目錄。")
        if path == DEFAULT_DB.resolve():
            raise RuntimeError("測試不可使用日常資料庫。")
    else:
        path = Path(supplied or DEFAULT_DB).resolve()
    if any(path.is_relative_to(root.resolve()) for root in WEB_ROOTS):
        raise RuntimeError("資料庫須放在前端與相依套件目錄之外。")
    return path


def make_engine(settings: Settings | None = None) -> Engine:
    if settings is not None and settings.database_url is not None:
        return create_engine(settings.database_url, pool_pre_ping=True, hide_parameters=True)
    path = database_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    engine = create_engine(
        URL.create("sqlite", database=str(path)),
        connect_args={"autocommit": False, "timeout": 5},
    )

    @event.listens_for(engine, "connect")
    def enable_foreign_keys(connection, _record):
        # SQLite reads connection pragmas outside transactions.
        connection.autocommit = True
        try:
            connection.execute("PRAGMA foreign_keys = ON").close()
        finally:
            connection.autocommit = False

    return engine


def lock_writes(connection: Connection) -> None:
    if connection.dialect.name == "postgresql":
        connection.execute(text("SELECT pg_advisory_xact_lock(7569271940288146083)"))


def initialize(engine: Engine, *, reset: bool = False) -> None:
    from backend.examples import populate

    if reset and engine.dialect.name != "sqlite":
        raise RuntimeError("只可重設本機 SQLite 資料。")
    with engine.begin() as connection:
        lock_writes(connection)
        config = Config(str(PROJECT_ROOT / "alembic.ini"))
        config.attributes["connection"] = connection
        command.upgrade(config, "head")
        if connection.scalar(select(initialized.c.id)) and not reset:
            return
        if reset:
            for table in (activities, deals, contacts, companies, initialized):
                connection.execute(table.delete())
        populate(connection)
        connection.execute(initialized.insert().values(id=1))
