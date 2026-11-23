import os

from fastapi import APIRouter, Request

from backend.api.errors import missing

from backend.api.models import MoveInput
from backend.api.records import write
from backend.services import summary
from backend.services.deals import move_deal

router = APIRouter(tags=["views"])


@router.get("/health")
def health(run_id: str | None = None):
    if run_id is not None and run_id != os.environ.get("ACCOUNTABLE_RUN_ID"):
        raise missing()
    return {"status": "ok"}


@router.get("/dashboard")
def dashboard(request: Request):
    with request.app.state.engine.connect() as connection:
        return summary.dashboard(connection)


@router.get("/pipeline")
def pipeline(request: Request):
    with request.app.state.engine.connect() as connection:
        return summary.pipeline(connection)


@router.post("/deals/{record_id}/move")
def move(request: Request, record_id: int, body: MoveInput):
    with write(request) as connection:
        move_deal(connection, record_id, body.stage, body.before_id)
        return summary.pipeline(connection)
