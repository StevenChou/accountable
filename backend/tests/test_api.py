from datetime import date, timedelta

import pytest
from fastapi.testclient import TestClient

from backend.main import create_app
from backend.schema import MAX_SAFE_INTEGER
from backend.services import activities as activity_service


def add(client, route, **values):
    response = client.post(f"/api/{route}", json=values)
    assert response.status_code == 201, response.text
    return response.json()


def deal(client, name, stage="new", amount=100_000, probability=40, **values):
    return add(client, "deals", name=name, stage=stage, amount_cents=amount, probability=probability, **values)


def lane(client, name):
    return next(lane for lane in client.get("/api/pipeline").json()["lanes"] if lane["stage"] == name)


def move(client, deal_id, stage, before_id=None):
    return client.post(f"/api/deals/{deal_id}/move", json={"stage": stage, "before_id": before_id})


def test_local_api_browser_policy(client):
    path = "/api/companies"
    same_origin = {"Origin": "http://127.0.0.1", "Sec-Fetch-Site": "same-origin"}
    assert client.get(path, headers=same_origin).status_code == 200
    assert client.get(path, headers={"Sec-Fetch-Site": "cross-site"}).status_code == 403
    assert client.get(path, headers={"Origin": "null"}).status_code == 403
    assert client.get(path, headers={"Host": "example.invalid"}).status_code == 400


def test_large_aggregate_amounts_keep_every_cent(client):
    for stage in ("new", "won"):
        deal(client, "大額商機", stage, amount=MAX_SAFE_INTEGER, probability=100)
        deal(client, "小額商機", stage, amount=2, probability=100)

    total = str(MAX_SAFE_INTEGER + 2)
    pipeline = client.get("/api/pipeline").json()
    assert pipeline["totals"] == {"count": 2, "amount_cents": total, "expected_cents": total}
    assert lane(client, "new")["totals"] == pipeline["totals"]
    dashboard = client.get("/api/dashboard").json()
    assert dashboard["open"] == pipeline["totals"]
    assert dashboard["won"]["amount_cents"] == dashboard["months"][-1]["amount_cents"] == total
    assert [row["amount_cents"] for row in dashboard["stage_amounts"] if row["stage"] in ("new", "won")] == [
        total,
        total,
    ]


def test_crud_links_and_delete_impact(client):
    company = add(client, "companies", name="測試公司", industry="食品", website="https://example.com")
    contact = add(client, "contacts", name="聯絡窗口", company_id=company["id"])
    assert contact["status"] == "lead"
    contact_url = f"/api/contacts/{contact['id']}"
    assert client.patch(contact_url, json={"status": "qualified"}).json()["status"] == "qualified"
    item = deal(client, "測試商機", company_id=company["id"], contact_id=contact["id"])
    company_url = f"/api/companies/{company['id']}"
    deal_url = f"/api/deals/{item['id']}"
    add(client, f"contacts/{contact['id']}/activities", kind="email", content="確認需求", follow_up="2026-01-08")
    add(client, f"deals/{item['id']}/activities", kind="note", content="商機活動")

    company_detail = client.get(company_url).json()
    assert company_detail["contacts"] == [{"id": contact["id"], "name": "聯絡窗口"}]
    assert company_detail["deals"] == [{"id": item["id"], "name": "測試商機"}]
    impact = client.get(f"{company_url}/delete-impact").json()
    assert impact == {"contacts": 1, "deals": 1}
    assert client.delete(company_url, params=impact).status_code == 204
    assert client.get(contact_url).json()["company_id"] is None
    assert client.get(deal_url).json()["company_id"] is None
    assert len(client.get(f"{contact_url}/activities").json()) == 1

    impact = client.get(f"{contact_url}/delete-impact").json()
    assert impact == {"activities": 1, "follow_ups": 1, "deals": 1}
    assert client.delete(contact_url, params=impact).status_code == 204
    assert client.get(deal_url).json()["contact_id"] is None
    assert len(client.get(f"{deal_url}/activities").json()) == 1
    assert client.get("/api/dashboard").json()["follow_ups"] == []


def test_delete_rechecks_preview_and_cascades(client):
    item = deal(client, "有跟進的商機")
    url = f"/api/deals/{item['id']}"
    empty = client.get(f"{url}/delete-impact").json()
    entry = add(client, f"deals/{item['id']}/activities", kind="call", content="新跟進", follow_up="2026-01-09")
    response = client.delete(url, params=empty)
    assert response.status_code == 409
    assert response.json()["impact"] == {"activities": 1, "follow_ups": 1}
    assert client.get(url).status_code == 200
    assert client.get(f"{url}/activities").json()[0]["id"] == entry["id"]
    assert client.delete(url, params=response.json()["impact"]).status_code == 204
    assert client.get(url).status_code == 404
    assert client.patch(f"/api/activities/{entry['id']}", json={"completed": True}).status_code == 404


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("amount_cents", -1),
        ("amount_cents", 2.5),
        ("probability", 101),
        ("probability", 50.5),
        ("stage", "unknown"),
        ("expected_close", "2026-02-30"),
        ("company_id", 9999),
        ("contact_id", 9999),
    ],
)
def test_deal_validation(client, field, value):
    values = {"name": "欄位驗證", "stage": "new", "amount_cents": 500, "probability": 10}
    values[field] = value
    response = client.post("/api/deals", json=values)
    assert response.status_code == 422
    assert field in response.json()["fields"]
    assert client.get("/api/deals").json() == []


@pytest.mark.parametrize("stage", ["won", "lost"])
def test_new_closed_deal_defaults_to_today(client, stage):
    item = deal(client, "直接結案", stage)
    assert item["actual_close"] == "2026-01-02"
    assert client.get(f"/api/deals/{item['id']}/activities").json() == []
    future = client.patch(f"/api/deals/{item['id']}", json={"actual_close": "2026-01-03"})
    assert future.status_code == 422


def test_stage_transition_and_sorting_are_persisted(client):
    item = deal(client, "提案來源", "proposal", expected_close="2026-01-01")
    first = deal(client, "第一筆議價", "negotiation")
    second = deal(client, "第二筆議價", "negotiation")
    assert [card["id"] for card in lane(client, "negotiation")["cards"]] == [second["id"], first["id"]]
    assert move(client, item["id"], "negotiation", first["id"]).status_code == 200
    assert [card["id"] for card in lane(client, "negotiation")["cards"]] == [
        second["id"],
        item["id"],
        first["id"],
    ]
    url = f"/api/deals/{item['id']}"
    record = client.get(url).json()
    assert record["probability"] == 75 and record["overdue"] is True
    assert client.patch(url, json={"probability": 66}).json()["probability"] == 66
    assert move(client, item["id"], "negotiation", second["id"]).status_code == 200
    assert client.get(url).json()["probability"] == 66
    assert move(client, item["id"], "negotiation").status_code == 200
    assert [card["id"] for card in lane(client, "negotiation")["cards"]] == [
        second["id"],
        first["id"],
        item["id"],
    ]
    assert move(client, item["id"], "new", second["id"]).status_code == 422
    assert len(client.get(f"{url}/activities").json()) == 1

    with TestClient(create_app(), base_url="http://127.0.0.1") as restarted:
        assert [card["id"] for card in lane(restarted, "negotiation")["cards"]] == [
            second["id"],
            first["id"],
            item["id"],
        ]

    won = client.patch(url, json={"stage": "won", "probability": 66}).json()
    assert (won["probability"], won["actual_close"], won["overdue"]) == (100, "2026-01-02", False)
    assert client.patch(url, json={"actual_close": "2026-01-01"}).status_code == 200
    assert move(client, item["id"], "lost").status_code == 200
    assert client.get(url).json()["actual_close"] == "2026-01-01"
    assert move(client, item["id"], "new").status_code == 200
    revived = client.get(url).json()
    assert (revived["probability"], revived["close_date"], revived["actual_close"]) == (10, "2026-01-01", None)
    assert len(client.get(f"{url}/activities").json()) == 4


def test_moves_roll_back_when_logging_fails(client, monkeypatch):
    item = deal(client, "保持原位", "proposal")
    before = client.get("/api/pipeline").json()

    def fail(*_args):
        raise RuntimeError("transaction interrupted")

    monkeypatch.setattr(activity_service, "log_stage_change", fail)
    with pytest.raises(RuntimeError):
        move(client, item["id"], "won")
    assert client.get("/api/pipeline").json() == before
    assert client.get(f"/api/deals/{item['id']}/activities").json() == []


def test_activities_follow_up_groups_and_report(client):
    contact = add(client, "contacts", name="有待辦的聯絡人")
    item = deal(client, "單分金額商機", expected_close="2026-01-02", amount=1, probability=25)
    deal(client, "另一筆單分商機", amount=1, probability=25)
    assert client.get(f"/api/deals/{item['id']}").json()["overdue"] is False
    assert client.get("/api/dashboard").json()["open"]["expected_cents"] == 1
    base = date(2026, 1, 2)
    created = {}
    for i, (offset, group) in enumerate(((-1, "late"), (0, "today"), (7, "soon"), (8, "later"))):
        owner = f"contacts/{contact['id']}" if i < 2 else f"deals/{item['id']}"
        created[group] = add(
            client,
            f"{owner}/activities",
            kind="email",
            content=group,
            follow_up=(base + timedelta(days=offset)).isoformat(),
            occurred_at=f"2026-01-02T0{i}:00:00+08:00",
        )
    dashboard = client.get("/api/dashboard").json()
    assert [entry["group"] for entry in dashboard["follow_ups"]] == list(created)
    assert [entry["content"] for entry in dashboard["recent"]] == list(reversed(created))
    assert [month["month"] for month in dashboard["months"]] == [
        "2025-08",
        "2025-09",
        "2025-10",
        "2025-11",
        "2025-12",
        "2026-01",
    ]
    assert client.patch(f"/api/activities/{created['soon']['id']}", json={"completed": True}).status_code == 200
    assert client.patch(f"/api/activities/{created['later']['id']}", json={"follow_up": None}).status_code == 200
    for i in range(12):
        add(client, f"contacts/{contact['id']}/activities", kind="note", content=f"活動 {i}")
    assert len(client.get("/api/dashboard").json()["recent"]) == 10
    assert move(client, item["id"], "won").status_code == 200
    timeline = client.get(f"/api/deals/{item['id']}/activities").json()
    assert timeline[0]["kind"] == "stage" and timeline[0]["content"] == "從新商機移至成交"
    assert sum(entry["completed"] for entry in timeline) == 1
    assert client.delete(f"/api/activities/{timeline[0]['id']}").status_code == 409
    dashboard = client.get("/api/dashboard").json()
    assert [entry["group"] for entry in dashboard["follow_ups"]] == ["late", "today"]
    assert dashboard["won"]["amount_cents"] == 1 and dashboard["won"]["count"] == 1
    assert lane(client, "won")["totals"]["amount_cents"] == 0
    assert move(client, item["id"], "new").status_code == 200
    assert client.get("/api/dashboard").json()["won"]["count"] == 0
