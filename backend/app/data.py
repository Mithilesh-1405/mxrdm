from functools import lru_cache
from app.config import settings
from repositories.sqlite import SnapshotRepository


@lru_cache(maxsize=1)
def repository() -> SnapshotRepository:
    return SnapshotRepository(settings.data_path)
