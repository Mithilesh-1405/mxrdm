from dataclasses import dataclass
from pathlib import Path
import os

ROOT = Path(__file__).resolve().parents[2]

@dataclass(frozen=True)
class Settings:
    data_path: Path = Path(os.getenv("DATA_PATH", str(ROOT / "backend" / "data" / "wind_snapshot.sqlite")))
    static_dir: Path | None = Path(os.environ["STATIC_DIR"]) if os.getenv("STATIC_DIR") else None
    port: int = int(os.getenv("PORT", "8000"))
    default_cutoff: str = os.getenv("DEFAULT_CUTOFF", "09:00")
    cors_origins: tuple[str, ...] = tuple(v.strip() for v in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",") if v.strip())

settings = Settings()
