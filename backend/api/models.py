from datetime import date
from typing import Annotated, Literal

from pydantic import AwareDatetime, BaseModel, ConfigDict, Field, StringConstraints

from backend.schema import MAX_SAFE_INTEGER

Name = Annotated[str, StringConstraints(min_length=1)]
Reference = Annotated[int, Field(strict=True, gt=0)]
Probability = Annotated[int, Field(strict=True, ge=0, le=100)]
Stage = Literal["new", "qualified", "proposal", "negotiation", "won", "lost"]


class Input(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class CompanyInput(Input):
    name: Name
    website: str | None = None
    industry: str | None = None
    notes: str | None = None


class ContactInput(Input):
    name: Name
    company_id: Reference | None = None
    title: str | None = None
    email: str | None = None
    phone: str | None = None
    status: Literal["lead", "qualified", "customer"] = "lead"


class DealInput(Input):
    name: Name
    company_id: Reference | None = None
    contact_id: Reference | None = None
    stage: Stage
    amount_cents: Annotated[int, Field(strict=True, ge=0, le=MAX_SAFE_INTEGER)]
    probability: Probability
    expected_close: date | None = None
    actual_close: date | None = None


class ActivityInput(Input):
    kind: Literal["note", "call", "email"]
    content: Name
    occurred_at: AwareDatetime | None = None
    follow_up: date | None = None
    completed: bool = False


class MoveInput(Input):
    stage: Stage
    before_id: Reference | None = None
