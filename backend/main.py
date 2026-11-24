import os
from contextlib import asynccontextmanager
from threading import Lock

import uvicorn
from fastapi import APIRouter, FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from sqlalchemy.exc import OperationalError

from backend.api import activities, views
from backend.api.errors import ApiError
from backend.api.records import record_routes
from backend.db import initialize, make_engine
from backend.services.records import RECORDS

FIELD_ERRORS = {
    "name": "請輸入名稱。",
    "status": "請選擇有效的狀態。",
    "stage": "請選擇有效的階段。",
    "amount_cents": "請輸入有效的非負金額，最多兩位小數。",
    "probability": "請輸入 0 至 100 的整數。",
    "expected_close": "請輸入有效的預計結案日。",
    "actual_close": "請輸入有效的實際結案日。",
    "company_id": "請重新選擇公司。",
    "contact_id": "請重新選擇聯絡人。",
    "kind": "請選擇有效的活動類型。",
    "content": "請輸入活動內容。",
    "occurred_at": "請輸入有效的活動時間。",
    "follow_up": "請輸入有效的跟進日期。",
}


@asynccontextmanager
async def lifespan(app):
    engine = make_engine()
    try:
        initialize(engine)
        app.state.engine = engine
        app.state.write_lock = Lock()
        yield
    finally:
        engine.dispose()


def create_app():
    app = FastAPI(title="Accountable", lifespan=lifespan)

    @app.middleware("http")
    async def check_browser_origin(request: Request, call_next):
        origin = request.headers.get("origin")
        site = request.headers.get("sec-fetch-site")
        local_origin = f"{request.url.scheme}://{request.url.netloc}"
        if site not in (None, "none", "same-origin") or origin not in (None, local_origin):
            return JSONResponse(status_code=403, content={"message": "請從 Accountable 的本機頁面操作。"})
        return await call_next(request)

    app.add_middleware(TrustedHostMiddleware, allowed_hosts=["127.0.0.1", "localhost"], www_redirect=False)
    api = APIRouter(prefix="/api")
    for resource in RECORDS:
        api.include_router(record_routes(resource))
    api.include_router(activities.router)
    api.include_router(views.router)
    app.include_router(api)

    @app.exception_handler(ApiError)
    async def api_error(_request, exc):
        return JSONResponse(status_code=exc.status, content=exc.body)

    @app.exception_handler(RequestValidationError)
    @app.exception_handler(ValidationError)
    async def validation_error(_request, exc):
        fields = {}
        for error in exc.errors():
            field = error["loc"][-1] if error["loc"] else "body"
            fields[str(field)] = FIELD_ERRORS.get(field, "請檢查輸入值。")
        return JSONResponse(
            status_code=422, content={"message": "請檢查標示的欄位。", "fields": fields},
        )

    @app.exception_handler(OperationalError)
    async def database_error(_request, exc):
        if getattr(exc.orig, "sqlite_errorname", "").startswith(("SQLITE_BUSY", "SQLITE_LOCKED")):
            return JSONResponse(status_code=409, content={"message": "資料庫目前忙碌，請稍後重試。"})
        return JSONResponse(status_code=500, content={"message": "無法讀寫本機資料，請檢查資料庫後重試。"})

    return app


app = create_app()

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=int(os.environ.get("ACCOUNTABLE_API_PORT", "8000")), proxy_headers=False)
