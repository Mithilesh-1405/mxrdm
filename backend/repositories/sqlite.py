import sqlite3
from pathlib import Path
import pandas as pd

class SnapshotRepository:
    def __init__(self, path: Path):
        self.path = path

    def read(self, table: str) -> pd.DataFrame:
        with sqlite3.connect(self.path) as connection:
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
        with sqlite3.connect(self.path) as connection:
            return dict(connection.execute("SELECT key, value FROM metadata").fetchall())
