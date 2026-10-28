from datetime import date, datetime, timedelta, timezone
import time
from typing import Any
import httpx

BASE_URL = "https://data.elexon.co.uk/bmrs/api/v1"


class ElexonClient:
    def __init__(self, retries: int = 4):
        self.retries = retries

    def get(self, path: str, params: dict[str, str]) -> list[dict[str, Any]]:
        for attempt in range(self.retries):
            try:
                response = httpx.get(f"{BASE_URL}{path}", params=params, timeout=90)
                response.raise_for_status()
                payload = response.json()
                if not isinstance(payload, list):
                    raise ValueError("Elexon response was not a list")
                return payload
            except (httpx.HTTPError, ValueError):
                if attempt == self.retries - 1:
                    raise
                time.sleep(2**attempt)
        return []

    def actual_day(self, delivery_date: date) -> list[dict[str, Any]]:
        value = delivery_date.isoformat()
        return self.get(
            "/datasets/FUELHH/stream",
            {
                "settlementDateFrom": value,
                "settlementDateTo": value,
                "fuelType": "WIND",
            },
        )

    def forecast_day(self, start: datetime, end: datetime) -> list[dict[str, Any]]:
        def stamp(value: datetime) -> str:
            return value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")

        return self.get(
            "/datasets/WINDFOR/stream",
            {"publishDateTimeFrom": stamp(start), "publishDateTimeTo": stamp(end)},
        )

    def forecast_window(self, start: datetime, end: datetime) -> list[dict[str, Any]]:
        rows: list[dict[str, Any]] = []
        cursor = start
        while cursor < end:
            chunk_end = min(cursor + timedelta(days=1), end)
            rows.extend(self.forecast_day(cursor, chunk_end))
            cursor = chunk_end
        return rows
