from contextlib import contextmanager
from typing import Annotated

from fastapi import APIRouter, Body, Request, Response

from backend.api.errors import ApiError
from backend.api.models import CompanyInput, ContactInput, DealInput
from backend.auth import Actor
from backend.db import lock_writes
from backend.schema import deals
from backend.services import records
from backend.services.deals import insert_deal, update_deal

MODELS = {"companies": CompanyInput, "contacts": ContactInput, "deals": DealInput}


@contextmanager
def write(request):
    with request.app.state.write_lock, request.app.state.engine.begin() as connection:
        lock_writes(connection)
        yield connection


def patched(model, previous, changes):
    defaults = {field: previous[field] for field in model.model_fields}
    return model.model_validate(defaults | changes).model_dump()


def record_routes(resource):
    router = APIRouter(prefix=f"/{resource}", tags=[resource])
    table = records.RECORDS[resource]
    model = MODELS[resource]

    @router.get("")
    def listing(request: Request):
        with request.app.state.engine.connect() as connection:
            return records.list_records(connection, table)

    @router.post("", status_code=201)
    def create(request: Request, body: Annotated[dict, Body()]):
        values = model.model_validate(body).model_dump()
        actor: Actor = request.state.actor
        with write(request) as connection:
            records.validate_links(connection, values)
            if table is deals:
                record_id = insert_deal(connection, values, actor)
            else:
                record_id = connection.execute(
                    table.insert().values(**values, **actor.creation())
                ).inserted_primary_key[0]
            return records.detail(connection, table, record_id)

    @router.get("/{record_id}")
    def detail(request: Request, record_id: int):
        with request.app.state.engine.connect() as connection:
            return records.detail(connection, table, record_id)

    @router.patch("/{record_id}")
    def edit(request: Request, record_id: int, body: Annotated[dict, Body()]):
        actor: Actor = request.state.actor
        with write(request) as connection:
            previous = records.get_row(connection, table, record_id)
            values = patched(model, previous, body)
            records.validate_links(connection, values)
            if table is deals:
                update_deal(connection, previous, values, actor)
            else:
                connection.execute(
                    table.update().where(table.c.id == record_id).values(**values, **actor.modification())
                )
            return records.detail(connection, table, record_id)

    @router.get("/{record_id}/delete-impact")
    def impact(request: Request, record_id: int):
        with request.app.state.engine.connect() as connection:
            return records.delete_impact(connection, table, record_id)

    @router.delete("/{record_id}", status_code=204)
    def remove(request: Request, record_id: int):
        with write(request) as connection:
            current = records.delete_impact(connection, table, record_id)
            if any(request.query_params.get(key) != str(value) for key, value in current.items()):
                raise ApiError(409, "影響的紀錄已變更，請再次確認。", impact=current)
            records.mark_related_on_delete(connection, table, record_id, request.state.actor)
            connection.execute(table.delete().where(table.c.id == record_id))
        return Response(status_code=204)

    return router
