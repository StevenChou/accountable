import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func, select

from backend import db
from backend.main import create_app
from backend.schema import companies, contacts, deals
from backend.seed import main as reset


def test_boot_preserves_data_and_empty_lists_until_reset(test_database):
    app = create_app()
    with TestClient(app, base_url="http://127.0.0.1") as client:
        company = client.post("/api/companies", json={"name": "新增的公司"}).json()
        assert len(client.get("/api/deals").json()) > 6
        with app.state.engine.begin() as connection:
            connection.execute(contacts.delete())

    with TestClient(create_app(), base_url="http://127.0.0.1") as client:
        assert client.get(f"/api/companies/{company['id']}").json()["name"] == "新增的公司"
        assert client.get("/api/contacts").json() == []

    reset()
    with TestClient(create_app(), base_url="http://127.0.0.1") as client:
        assert client.get(f"/api/companies/{company['id']}").status_code == 404
        assert {row["status"] for row in client.get("/api/contacts").json()} == {"lead", "qualified", "customer"}
        assert len(client.get("/api/dashboard").json()["follow_ups"]) > 3


@pytest.mark.parametrize("mode", ["missing", "normal", "symlink", "outside"])
def test_start_and_reset_refuse_unowned_path(tmp_path, monkeypatch, mode):
    daily = tmp_path / "daily.sqlite3"
    monkeypatch.setattr(db, "DEFAULT_DB", daily)
    monkeypatch.delenv("ACCOUNTABLE_DB_PATH", raising=False)
    monkeypatch.delenv("ACCOUNTABLE_TEST_MODE", raising=False)
    with TestClient(create_app(), base_url="http://127.0.0.1") as client:
        daily_record = client.post("/api/companies", json={"name": "須保留的日常資料"}).json()

    root = tmp_path / "run"
    root.mkdir()
    monkeypatch.setenv("ACCOUNTABLE_TEST_MODE", "1")
    monkeypatch.setenv("ACCOUNTABLE_TEST_ROOT", str(root))
    if mode == "normal":
        monkeypatch.setenv("ACCOUNTABLE_TEST_ROOT", str(tmp_path))
        monkeypatch.setenv("ACCOUNTABLE_DB_PATH", str(daily))
    if mode == "symlink":
        link = root / "link.sqlite3"
        try:
            link.symlink_to(daily)
        except OSError:
            pytest.skip("系統未允許建立符號連結")
        monkeypatch.setenv("ACCOUNTABLE_DB_PATH", str(link))
    if mode == "outside":
        monkeypatch.setenv("ACCOUNTABLE_DB_PATH", str(tmp_path / "outside.sqlite3"))

    with pytest.raises(RuntimeError):
        with TestClient(create_app(), base_url="http://127.0.0.1"):
            pytest.fail("測試服務應在連線前中止")
    with pytest.raises(RuntimeError):
        reset()

    monkeypatch.delenv("ACCOUNTABLE_TEST_MODE")
    monkeypatch.delenv("ACCOUNTABLE_DB_PATH", raising=False)
    with TestClient(create_app(), base_url="http://127.0.0.1") as client:
        assert client.get(f"/api/companies/{daily_record['id']}").json()["name"] == "須保留的日常資料"


def test_database_cannot_be_placed_in_frontend_files(tmp_path, monkeypatch):
    web_root = tmp_path / "frontend"
    path = web_root / "public" / "offices.data"
    monkeypatch.setattr(db, "WEB_ROOTS", (web_root,))
    monkeypatch.setenv("ACCOUNTABLE_DB_PATH", str(path))
    monkeypatch.delenv("ACCOUNTABLE_TEST_MODE", raising=False)

    with pytest.raises(RuntimeError, match="資料庫須放在前端與相依套件目錄之外"):
        reset()
    assert not path.parent.exists()


def test_reset_preserves_database_if_population_fails(test_database, monkeypatch):
    from backend import examples

    engine = db.make_engine()
    db.initialize(engine)
    with engine.connect() as connection:
        before = connection.scalar(select(func.count()).select_from(companies))
    original = examples.populate

    def fail(connection):
        original(connection)
        raise RuntimeError("write interrupted")

    monkeypatch.setattr(examples, "populate", fail)
    try:
        with pytest.raises(RuntimeError):
            db.initialize(engine, reset=True)
        with engine.connect() as connection:
            assert connection.scalar(select(func.count()).select_from(companies)) == before
            assert connection.scalar(select(func.count()).select_from(deals)) > 6
    finally:
        engine.dispose()
