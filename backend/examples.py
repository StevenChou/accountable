from datetime import UTC, timedelta

from backend import clock
from backend.schema import STAGES, activities, companies, contacts, deals
from backend.services.activities import utc_text


def populate(connection):
    today = clock.today()
    now = clock.now()
    organizations = (
        ("島嶼食品", "食品零售", "island"),
        ("棲光旅店", "旅宿服務", "gloam"),
        ("森序設計", "設計服務", "grove"),
        ("青禾製造", "精密製造", "harvest"),
        ("鑄川工業", "工業設備", "forge"),
        ("知序科技", "企業軟體", "atlas"),
    )
    people = (
        ("林怡君", "採購經理", "customer"),
        ("王品安", "營運主管", "lead"),
        ("周靖涵", "設計總監", "qualified"),
        ("陳思妤", "廠務主任", "qualified"),
        ("高立雯", "設備經理", "lead"),
        ("羅承翰", "專案經理", "customer"),
    )
    company_ids, contact_ids, deal_ids = [], [], []
    for name, industry, slug in organizations:
        company_ids.append(connection.execute(companies.insert().values(
            name=name, industry=industry, website=f"https://{slug}.example",
        )).inserted_primary_key[0])
    for index, (name, title, status) in enumerate(people):
        contact_ids.append(connection.execute(contacts.insert().values(
            name=name, title=title, status=status, company_id=company_ids[index],
            email=f"{organizations[index][2]}@example.com", phone=f"02-5550-010{index}",
        )).inserted_primary_key[0])

    sample_deals = {
        "new": [("門市包裝更新", 0, 95000, 11), ("客戶入口網站", 1, 140000, 68), ("產品型錄製作", 2, 75000, 42)],
        "qualified": [("倉儲盤點流程", 3, 210000, 10), ("年度保養方案", 4, 125000, -3), ("南區教育訓練", 5, 185000, 18)],
        "proposal": [("產線稽核系統", 3, 280000, 4), ("門市數據整合", 0, 360000, 16), ("會員服務改版", 1, 150000, 23)],
        "negotiation": [("年度維護合約", 5, 440000, 2), ("新廠監控部署", 4, 315000, -2), ("展示間設備升級", 2, 220000, 9)],
        "won": [("採購系統第一期", 3, 380000, 0), ("門市設備換新", 0, 260000, 0), ("服務台導入", 5, 185000, 0),
                ("進貨排程整合", 3, 280000, -1), ("預約網站維護", 1, 180000, -1), ("設備備品合約", 4, 145000, -1),
                ("供應商入口平台", 0, 300000, -2), ("維修派工作業", 4, 210000, -2),
                ("新店點導入", 0, 245000, -3), ("品質檢查建置", 3, 215000, -3),
                ("設備資料遷移", 4, 240000, -5), ("工單流程顧問", 5, 110000, -5)],
        "lost": [("連鎖據點巡檢", 0, 155000, 0), ("展會報到系統", 2, 245000, -1), ("線上訂房外掛", 1, 90000, -2)],
    }
    for stage, entries in sample_deals.items():
        for position, (name, company, amount, offset) in enumerate(entries):
            actual = None
            expected = None
            if stage in ("won", "lost"):
                month = today.year * 12 + today.month - 1 + offset
                year, index = divmod(month, 12)
                day = min(today.day, 12 + position % 10) if offset == 0 else 12 + position % 10
                actual = today.replace(year=year, month=index + 1, day=day)
            else:
                expected = today + timedelta(days=offset)
            deal_ids.append(connection.execute(deals.insert().values(
                name=name, company_id=company_ids[company], contact_id=contact_ids[company],
                amount_cents=amount * 100, stage=stage, probability=STAGES[stage][1],
                expected_close=expected, actual_close=actual, position=position,
            )).inserted_primary_key[0])

    sample_activities = (
        ("stage", "從提案移至議價", "deal_id", 9, None, False),
        ("call", "確認首批交付項目", "contact_id", 3, 0, False),
        ("email", "已寄出設計樣張與估價", "deal_id", 0, 3, False),
        ("email", "寄出更新版維護報價", "deal_id", 9, -3, False),
        ("stage", "從議價移至成交", "deal_id", 12, None, False),
        ("note", "確認監控設備交付時程", "deal_id", 10, -2, False),
        ("call", "回覆產線稽核提案問題", "deal_id", 6, 0, False),
        ("note", "確認員工訓練名單", "deal_id", 5, 10, False),
        ("email", "已確認門市數據欄位", "deal_id", 7, -2, True),
        ("call", "預約下週展示間場勘", "deal_id", 11, None, False),
    )
    for index, (kind, content, owner_type, owner, due, completed) in enumerate(sample_activities):
        owners = contact_ids if owner_type == "contact_id" else deal_ids
        connection.execute(activities.insert().values(
            **{owner_type: owners[owner]}, kind=kind, content=content,
            occurred_at=utc_text(now.astimezone(UTC) - timedelta(hours=2 + index * 10)),
            follow_up=None if due is None else today + timedelta(days=due), completed=completed,
        ))
