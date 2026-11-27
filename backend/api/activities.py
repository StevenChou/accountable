from typing import Annotated

from fastapi import APIRouter, Body, Request, Response

from backend.api.models import ActivityInput
from backend.api.records import patched, write
from backend.auth import Actor
from backend.schema import activities, contacts, deals
from backend.services import activities as service
from backend.services.records import get_row, public_record

router = APIRouter(tags=["activities"])


def owner_routes(resource, table, foreign_key):
    owner = APIRouter(prefix=f"/{resource}/{{owner_id}}/activities")

    @owner.get("")
    def listing(request: Request, owner_id: int):
        with request.app.state.engine.connect() as connection:
            return service.timeline(connection, table, owner_id)

    @owner.post("", status_code=201)
    def create(request: Request, owner_id: int, body: ActivityInput):
        values = service.manual_values(body.model_dump())
        actor: Actor = request.state.actor
        with write(request) as connection:
            get_row(connection, table, owner_id)
            activity_id = connection.execute(
                activities.insert().values(**values, **{foreign_key: owner_id}, **actor.creation())
            ).inserted_primary_key[0]
            return public_record(get_row(connection, activities, activity_id))

    return owner


router.include_router(owner_routes("contacts", contacts, "contact_id"))
router.include_router(owner_routes("deals", deals, "deal_id"))


@router.patch("/activities/{activity_id}")
def edit(request: Request, activity_id: int, body: Annotated[dict, Body()]):
    actor: Actor = request.state.actor
    with write(request) as connection:
        previous = service.manual_activity(connection, activity_id)
        values = service.manual_values(patched(ActivityInput, previous, body))
        connection.execute(
            activities.update().where(activities.c.id == activity_id).values(**values, **actor.modification())
        )
        return public_record(get_row(connection, activities, activity_id))


@router.delete("/activities/{activity_id}", status_code=204)
def remove(request: Request, activity_id: int):
    with write(request) as connection:
        service.manual_activity(connection, activity_id)
        connection.execute(activities.delete().where(activities.c.id == activity_id))
    return Response(status_code=204)
