from time import monotonic

import httpx
import pytest
from sqlalchemy import select

from backend.auth import DEVELOPMENT_PASSWORD, Actor
from backend.schema import activities, companies, contacts, deals
from backend.tests.conftest import sign_in


def test_local_login_session_expiry_and_revocation(client):
    token = client.headers.pop("Authorization")
    assert client.get("/api/auth/config").json() == {"mode": "local"}
    assert client.get("/api/health").status_code == 200
    for path in ("/companies", "/contacts", "/deals", "/dashboard", "/pipeline", "/deals/1/activities"):
        assert client.get(f"/api{path}").status_code == 401
    assert client.post("/api/companies", json={"name": "未驗證"}).status_code == 401
    assert client.get("/api/auth/session", headers={"Authorization": "Bearer invalid"}).status_code == 401
    denied = client.post("/api/auth/login", json={"email": "sam@example.test", "password": "wrong"})
    assert denied.status_code == 401

    client.headers["Authorization"] = token
    assert client.get("/api/auth/session").json() == {"email": "alex@example.test"}
    assert client.post("/api/auth/logout").status_code == 204
    assert client.get("/api/companies").status_code == 401
    sign_in(client)
    active = client.headers["Authorization"].split()[1]
    client.app.state.auth.sessions[active] = (Actor("alex", "alex@example.test"), monotonic() - 1)
    assert client.get("/api/companies").status_code == 401


@pytest.mark.parametrize("status", [200, 401, 503, None])
def test_production_verifies_each_token_and_distinguishes_upstream_error(production_client, monkeypatch, status):
    client = production_client
    calls = []

    async def get(url, **options):
        calls.append((url, options["headers"]))
        if status is None:
            raise httpx.ReadTimeout("upstream timed out")
        return httpx.Response(
            status, request=httpx.Request("GET", url), json={"id": "member-id", "email": "member@example.test"}
        )

    monkeypatch.setattr(client.app.state.auth.client, "get", get)
    expected = status if status is not None else 503
    assert client.get("/api/auth/session", headers={"Authorization": "Bearer sample-token"}).status_code == expected
    assert client.get("/api/companies", headers={"Authorization": "Bearer sample-token"}).status_code == expected
    assert len(calls) == 2
    assert calls[0][0] == "https://auth.example.test/auth/v1/user"
    assert calls[0][1]["Authorization"] == "Bearer sample-token"
    if status == 200:
        created = client.post(
            "/api/companies", headers={"Authorization": "Bearer sample-token"}, json={"name": "正式帳號測試"}
        )
        assert created.json()["created_by_email"] == "member@example.test"
    assert (
        client.post(
            "/api/auth/login", json={"email": "alex@example.test", "password": DEVELOPMENT_PASSWORD}
        ).status_code
        == 404
    )


def test_two_members_share_records_and_preserve_creator(client):
    company = client.post("/api/companies", json={"name": "公司 A"}).json()
    contact = client.post("/api/contacts", json={"name": "聯絡人 A", "company_id": company["id"]}).json()
    deal = client.post(
        "/api/deals",
        json={"name": "商機 A", "company_id": company["id"], "stage": "new", "amount_cents": 200, "probability": 10},
    ).json()
    timeline = f"/api/deals/{deal['id']}/activities"
    entry = client.post(timeline, json={"kind": "note", "content": "跟進 A", "follow_up": "2026-02-02"}).json()
    sign_in(client, "sam@example.test")
    for resource, record in (("companies", company), ("contacts", contact), ("deals", deal)):
        path = f"/api/{resource}/{record['id']}"
        assert client.get(path).json()["created_by_email"] == "alex@example.test"
        assert client.patch(path, json={"name": "由 B 更新"}).json()["created_by_email"] == "alex@example.test"
    assert client.patch(f"/api/activities/{entry['id']}", json={"completed": True}).status_code == 200
    assert client.post(f"/api/deals/{deal['id']}/move", json={"stage": "proposal"}).status_code == 200
    assert client.get(timeline).json()[0]["created_by_email"] == "sam@example.test"
    assert (
        client.post("/api/companies", json={"name": "偽造", "created_by_email": "fake@example.test"}).status_code == 422
    )

    with client.app.state.engine.connect() as connection:
        for table, row in ((companies, company), (contacts, contact), (deals, deal), (activities, entry)):
            audit = connection.execute(select(table).where(table.c.id == row["id"])).mappings().one()
            assert (audit["created_by_id"], audit["updated_by_id"], audit["updated_by_email"]) == (
                "alex",
                "sam",
                "sam@example.test",
            )
    sign_in(client)
    path = f"/api/companies/{company['id']}"
    assert client.delete(path, params=client.get(f"{path}/delete-impact").json()).status_code == 204
    with client.app.state.engine.connect() as connection:
        audit = connection.execute(select(contacts).where(contacts.c.id == contact["id"])).mappings().one()
        assert audit["company_id"] is None and audit["updated_by_id"] == "alex"
