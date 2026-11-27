def test_search_requires_session(client):
    client.headers.pop("Authorization")
    assert client.get("/api/search", params={"q": "ACME"}).status_code == 401


def test_search_matches_only_names_and_treats_symbols_as_text(client):
    company = client.post("/api/companies", json={"name": "Acme% 甲", "industry": "製造"}).json()
    contact = client.post("/api/contacts", json={"name": "ACME_乙", "company_id": company["id"]}).json()
    deal = client.post(
        "/api/deals",
        json={
            "name": "Acme% 甲",
            "stage": "new",
            "amount_cents": 100,
            "probability": 10,
        },
    ).json()

    def search(query):
        return client.get("/api/search", params={"q": query}).json()

    results = search(" aCmE ")
    assert results == [
        {"resource": "companies", "id": company["id"], "name": company["name"]},
        {"resource": "contacts", "id": contact["id"], "name": contact["name"]},
        {"resource": "deals", "id": deal["id"], "name": deal["name"]},
    ]
    assert search("%") == search("甲") == [results[0], results[2]]
    assert search("_") == [results[1]]
    assert search("製造") == search("   ") == search("不存在") == []
