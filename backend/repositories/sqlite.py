import sqlite3
from contextlib import closing
from pathlib import Path

import pandas as pd


class SnapshotRepository:
    def __init__(self, path: Path):
        self.path = Path(path).resolve()

    def connect(self) -> sqlite3.Connection:
        uri = f"{self.path.as_uri()}?mode=ro&immutable=1"
        return sqlite3.connect(uri, uri=True, check_same_thread=False)

    def read(self, table: str) -> pd.DataFrame:
        with closing(self.connect()) as connection:
            return pd.read_sql_query(f"SELECT * FROM {table}", connection)

    def actuals(self) -> pd.DataFrame:
        frame = self.read("actuals")
        frame["start_time"] = pd.to_datetime(frame["start_time"], utc=True)
        return frame

    def forecasts(self) -> pd.DataFrame:
        frame = self.read("forecasts")
        frame["start_time"] = pd.to_datetime(frame["start_time"], utc=True)
        frame["publish_time"] = pd.to_datetime(frame["publish_time"], utc=True)
        return frame

    def metadata(self) -> dict[str, str]:
        with closing(self.connect()) as connection:
            return dict(
                connection.execute("SELECT key, value FROM metadata").fetchall()
            )