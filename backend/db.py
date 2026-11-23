import os
from pathlib import Path

from sqlalchemy import URL, create_engine, event, select
from sqlalchemy.engine import Engine

from backend.schema import activities, companies, contacts, deals, initialized, metadata

DEFAULT_DB = Path(__file__).resolve().parent.parent / "data" / "accountable.sqlite3"


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
        return path
    return Path(supplied or DEFAULT_DB).resolve()


def make_engine() -> Engine:
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


def initialize(engine: Engine, *, reset: bool = False) -> None:
    from backend.examples import populate

    with engine.begin() as connection:
        metadata.create_all(connection)
        if connection.scalar(select(initialized.c.id)) and not reset:
            return
        if reset:
            for table in (activities, deals, contacts, companies, initialized):
                connection.execute(table.delete())
        populate(connection)
        connection.execute(initialized.insert().values(id=1))
