import pytest
from sqlalchemy import inspect, text

from backend import db
from backend.config import load_settings


def test_test_mode_ignores_production_settings(test_database, monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgresql://unused.invalid/postgres")
    monkeypatch.setenv("SUPABASE_URL", "https://unused.invalid")
    monkeypatch.setenv("SUPABASE_PUBLISHABLE_KEY", "sb_publishable_example")
    assert not load_settings(production=True).production
    assert db.database_path() == test_database


def test_missing_production_credentials_fail_closed(monkeypatch):
    for name in ("ACCOUNTABLE_TEST_MODE", "DATABASE_URL", "SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY"):
        monkeypatch.delenv(name, raising=False)
    with pytest.raises(RuntimeError, match="正式模式需要"):
        load_settings(production=True)


def test_formal_settings_require_tls_and_only_accept_publishable_key(monkeypatch):
    monkeypatch.delenv("ACCOUNTABLE_TEST_MODE", raising=False)
    monkeypatch.setenv("DATABASE_URL", "postgresql://database.example.test/accountable")
    monkeypatch.setenv("SUPABASE_URL", "https://auth.example.test/")
    monkeypatch.setenv("SUPABASE_PUBLISHABLE_KEY", "sb_publishable_example")
    settings = load_settings(production=True)
    assert settings.database_url is not None
    assert settings.database_url.drivername == "postgresql+psycopg"
    assert settings.database_url.query["sslmode"] == "require"
    assert settings.supabase_url == "https://auth.example.test"

    monkeypatch.setenv("SUPABASE_PUBLISHABLE_KEY", "non-public-test-value")
    with pytest.raises(RuntimeError, match="publishable key"):
        load_settings(production=True)
    monkeypatch.setenv("DATABASE_URL", "postgresql://database.example.test/accountable?sslmode=disable")
    with pytest.raises(RuntimeError, match="連線須使用 TLS"):
        load_settings(production=True)


def test_render_serves_assets_routes_health_and_public_configuration(production_client):
    client = production_client
    assert client.get("/api/health").json() == {"status": "ok"}
    headers = {"Origin": "https://app.example.test"}
    assert client.get("/api/auth/config", headers=headers).json() == {
        "mode": "supabase",
        "url": "https://auth.example.test",
        "publishableKey": "sb_publishable_example",
    }
    assert client.get("/api/auth/config", headers={"Origin": "https://other.test"}).status_code == 403
    assert client.get("/api/health", headers={"Host": "other.test"}).status_code == 400
    assert client.get("/companies/1").text == "<html>Accountable</html>"
    assert client.get("/assets/sample.js").text == "export {}"
    assert client.get("/assets/missing.js").status_code == 404
    assert client.get("/api/no-such-route").status_code == 404


def test_migrations_preserve_existing_sqlite_rows(test_database):
    engine = db.make_engine()
    try:
        # Build the legacy schema, then simulate an existing database without a revision marker.
        from alembic import command
        from alembic.config import Config

        with engine.begin() as connection:
            config = Config("alembic.ini", attributes={"connection": connection})
            command.upgrade(config, "0001_crm")
            connection.execute(text("DROP TABLE alembic_version"))
            connection.execute(text("INSERT INTO initialized (id) VALUES (1)"))
            connection.execute(text("INSERT INTO companies (id, name) VALUES (17, '既有公司')"))
            connection.execute(
                text("INSERT INTO contacts (id, name, company_id, status) VALUES (42, '舊聯絡人', 17, 'lead')")
            )
        db.initialize(engine)
        db.initialize(engine)
        with engine.connect() as connection:
            row = connection.execute(text("SELECT id, company_id, created_by_email FROM contacts")).one()
            assert tuple(row) == (42, 17, "sample@example.test")
            assert connection.execute(text("SELECT count(*) FROM companies")).scalar_one() == 1
            assert inspect(connection).get_foreign_keys("contacts")
    finally:
        engine.dispose()
