import os
from dataclasses import dataclass, field
from pathlib import Path
from urllib.parse import urlsplit

from sqlalchemy.engine import URL, make_url
from sqlalchemy.exc import ArgumentError

PROJECT_ROOT = Path(__file__).resolve().parent.parent


@dataclass(frozen=True)
class Settings:
    database_url: URL | None = field(default=None, repr=False)
    supabase_url: str = ""
    publishable_key: str = field(default="", repr=False)
    public_host: str = ""

    @property
    def production(self) -> bool:
        return self.database_url is not None

    @property
    def allowed_hosts(self) -> list[str]:
        return [self.public_host] if self.public_host else ["127.0.0.1", "localhost"]


def load_settings(*, production: bool = False) -> Settings:
    if not production or os.environ.get("ACCOUNTABLE_TEST_MODE") == "1":
        return Settings()

    names = ("DATABASE_URL", "SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY")
    database_url, supabase_url, key = (os.environ.get(name, "").strip() for name in names)
    if not all((database_url, supabase_url, key)):
        raise RuntimeError("正式模式需要 DATABASE_URL、SUPABASE_URL 與 SUPABASE_PUBLISHABLE_KEY。")
    try:
        database = make_url(database_url)
        supabase = urlsplit(supabase_url)
    except (ArgumentError, ValueError):
        raise RuntimeError("請檢查正式模式的資料庫及 Supabase 設定。") from None
    if database.get_backend_name() not in ("postgres", "postgresql") or not database.host:
        raise RuntimeError("DATABASE_URL 須指向 Postgres。")
    sslmode = database.query.get("sslmode", "require")
    if sslmode not in ("require", "verify-ca", "verify-full"):
        raise RuntimeError("正式資料庫連線須使用 TLS。")
    if (
        supabase.scheme != "https"
        or not supabase.hostname
        or supabase.username is not None
        or supabase.path not in ("", "/")
        or supabase.query
        or supabase.fragment
        or not key.startswith("sb_publishable_")
    ):
        raise RuntimeError("請檢查 Supabase Project URL 和 publishable key。")
    return Settings(
        database.set(drivername="postgresql+psycopg").update_query_dict({"sslmode": sslmode}),
        supabase_url.rstrip("/"),
        key,
        os.environ.get("RENDER_EXTERNAL_HOSTNAME", ""),
    )
