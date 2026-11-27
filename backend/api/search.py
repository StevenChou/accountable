from typing import Literal

from fastapi import APIRouter, Request
from pydantic import BaseModel

from backend.services.search import find_records

router = APIRouter(tags=["search"])


class SearchResult(BaseModel):
    resource: Literal["companies", "contacts", "deals"]
    id: int
    name: str


@router.get("/search", response_model=list[SearchResult])
def search(request: Request, q: str = ""):
    with request.app.state.engine.connect() as connection:
        return find_records(connection, q)
