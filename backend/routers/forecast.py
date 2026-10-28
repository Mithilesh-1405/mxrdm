import json
from typing import Any
from fastapi import APIRouter, Query
from backend.app.config import settings
from backend.app.errors import error
from backend.schemas import DecisionView
from backend.services.api_data import cached_decision, valid_cutoff, valid_date

router = APIRouter(prefix="/api/v1/forecast")


@router.get("/decision-view", response_model=DecisionView)
def decision_view(
    delivery_date: str = Query(...), cutoff: str = Query(settings.default_cutoff)
) -> Any:
    try:
        parsed_date = valid_date(delivery_date, "delivery_date")
        return json.loads(
            cached_decision(parsed_date.isoformat(), valid_cutoff(cutoff))
        )
    except FileNotFoundError:
        return error(
            "snapshot_missing", "The local data snapshot is not available", 503
        )
    except ValueError as exc:
        return error("invalid_request", str(exc))
