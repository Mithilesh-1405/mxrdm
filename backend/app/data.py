from functools import lru_cache
from backend.app.config import settings
from backend.repositories.sqlite import SnapshotRepository


@lru_cache(maxsize=1)
def repository() -> SnapshotRepository:
    return SnapshotRepository(settings.data_path)
