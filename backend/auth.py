from dataclasses import dataclass
from secrets import token_urlsafe
from time import monotonic
from typing import Annotated

import httpx
from fastapi import APIRouter, Depends, Request, Response
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

from backend.api.errors import ApiError
from backend.config import Settings


@dataclass(frozen=True)
class Actor:
    id: str
    email: str

    def creation(self) -> dict[str, str]:
        return {"created_by_id": self.id, "created_by_email": self.email, **self.modification()}

    def modification(self) -> dict[str, str]:
        return {"updated_by_id": self.id, "updated_by_email": self.email}


DEVELOPMENT_USERS = {f"{name}@example.test": Actor(name, f"{name}@example.test") for name in ("alex", "sam")}
DEVELOPMENT_PASSWORD = "accountable-demo"
SESSION_SECONDS = 24 * 60 * 60


def unauthorized() -> ApiError:
    return ApiError(401, "請確認電子郵件與密碼，或重新登入。")


class Auth:
    def __init__(self, settings: Settings, client: httpx.AsyncClient):
        self.settings = settings
        self.client = client
        self.sessions: dict[str, tuple[Actor, float]] = {}

    def sign_in(self, email: str, password: str) -> str:
        actor = DEVELOPMENT_USERS.get(email.strip().lower())
        if actor is None or password != DEVELOPMENT_PASSWORD:
            raise unauthorized()
        now = monotonic()
        self.sessions = {key: value for key, value in self.sessions.items() if value[1] > now}
        token = token_urlsafe(32)
        self.sessions[token] = (actor, now + SESSION_SECONDS)
        return token

    async def verify(self, token: str) -> Actor:
        if not self.settings.production:
            session = self.sessions.get(token)
            if session is None or session[1] <= monotonic():
                raise unauthorized()
            return session[0]

        try:
            response = await self.client.get(
                f"{self.settings.supabase_url}/auth/v1/user",
                headers={"apikey": self.settings.publishable_key, "Authorization": f"Bearer {token}"},
            )
            if response.status_code in (401, 403):
                raise unauthorized()
            response.raise_for_status()
            payload = response.json()
        except (httpx.HTTPError, ValueError):
            raise ApiError(503, "暫時無法驗證登入，請稍後重試。") from None
        if isinstance(payload, dict):
            user_id, email = payload.get("id"), payload.get("email")
            if isinstance(user_id, str) and user_id and isinstance(email, str) and email:
                return Actor(user_id, email)
        raise unauthorized()


bearer = HTTPBearer(auto_error=False)


async def require_actor(
    request: Request, credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)]
) -> Actor:
    if credentials is None:
        raise unauthorized()
    actor = await request.app.state.auth.verify(credentials.credentials)
    request.state.actor = actor
    return actor


class Credentials(BaseModel):
    email: str
    password: str


def auth_routes(settings: Settings) -> APIRouter:
    router = APIRouter(prefix="/auth")

    @router.get("/config")
    def config(response: Response):
        response.headers["Cache-Control"] = "no-store"
        if settings.production:
            return {
                "mode": "supabase",
                "url": settings.supabase_url,
                "publishableKey": settings.publishable_key,
            }
        return {"mode": "local"}

    @router.get("/session")
    def session(actor: Annotated[Actor, Depends(require_actor)], response: Response):
        response.headers["Cache-Control"] = "no-store"
        return {"email": actor.email}

    if not settings.production:

        @router.post("/login")
        async def sign_in(body: Credentials, request: Request, response: Response):
            response.headers["Cache-Control"] = "no-store"
            return {"token": request.app.state.auth.sign_in(body.email, body.password)}

        @router.post("/logout", status_code=204)
        async def sign_out(
            request: Request, credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)]
        ):
            if credentials is None:
                raise unauthorized()
            request.app.state.auth.sessions.pop(credentials.credentials, None)

    return router
