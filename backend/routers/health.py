from fastapi import APIRouter
from backend.app.config import settings
from backend.app.errors import error
from backend.schemas import HealthResponse, MetaResponse
from backend.services.api_data import meta_data

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
@router.get("/api/v1/health", response_model=HealthResponse)
def health() -> dict[str, str]:
    available = settings.data_path.exists()
    return {
        "status": "ok" if available else "degraded",
        "snapshot": "available" if available else "missing",
    }


@router.get("/api/v1/meta", response_model=MetaResponse)
def meta() -> dict[str, object]:
    try:
        return meta_data()
    except FileNotFoundError:
        return error(
            "snapshot_missing", "The local data snapshot is not available", 503
        )
