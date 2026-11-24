from datetime import UTC, date, datetime

import pytest
from fastapi.testclient import TestClient

from backend import clock
from backend.main import create_app
from backend.schema import activities, companies, contacts, deals


@pytest.fixture
def test_database(tmp_path, monkeypatch):
    path = tmp_path / "test.sqlite3"
    monkeypatch.setenv("ACCOUNTABLE_TEST_MODE", "1")
    monkeypatch.setenv("ACCOUNTABLE_TEST_ROOT", str(tmp_path))
    monkeypatch.setenv("ACCOUNTABLE_DB_PATH", str(path))
    monkeypatch.setattr(clock, "today", lambda: date(2026, 1, 2))
    monkeypatch.setattr(clock, "now", lambda: datetime(2026, 1, 2, 13, 25, tzinfo=UTC))
    return path


@pytest.fixture
def client(test_database):
    app = create_app()
    with TestClient(app, base_url="http://127.0.0.1") as client:
        with app.state.engine.begin() as connection:
            for table in (activities, deals, contacts, companies):
                connection.execute(table.delete())
        yield client
