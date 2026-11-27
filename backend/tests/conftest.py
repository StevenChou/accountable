from datetime import UTC, date, datetime

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import make_url

from backend import clock, db, main
from backend.auth import DEVELOPMENT_PASSWORD
from backend.config import Settings
from backend.main import create_app
from backend.schema import activities, companies, contacts, deals


def sign_in(client, email="alex@example.test"):
    response = client.post("/api/auth/login", json={"email": email, "password": DEVELOPMENT_PASSWORD})
    assert response.status_code == 200
    client.headers["Authorization"] = f"Bearer {response.json()['token']}"


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
        sign_in(client)
        yield client


@pytest.fixture
def production_client(test_database, tmp_path, monkeypatch):
    dist = tmp_path / "frontend" / "dist"
    dist.mkdir(parents=True)
    (dist / "fonts").mkdir()
    (dist / "assets").mkdir()
    (dist / "index.html").write_text("<html>Accountable</html>")
    (dist / "assets" / "sample.js").write_text("export {}")
    monkeypatch.setattr(main, "PROJECT_ROOT", tmp_path)
    monkeypatch.setattr(main, "make_engine", lambda _settings: db.make_engine())
    settings = Settings(
        make_url("postgresql+psycopg://database.example.test/accountable"),
        "https://auth.example.test",
        "sb_publishable_example",
        "app.example.test",
    )
    with TestClient(create_app(settings), base_url="http://app.example.test") as client:
        yield client
