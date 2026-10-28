from datetime import date, datetime, time, timedelta, timezone
import sqlite3
from pathlib import Path
import pandas as pd
from backend.clients.elexon import ElexonClient

START = date(2026, 1, 1)
END = date(2026, 1, 31)


def normalize_actuals(rows: list[dict[str, object]]) -> pd.DataFrame:
    frame = pd.DataFrame(rows).rename(
        columns={"startTime": "start_time", "generation": "generation_mw"}
    )
    if frame.empty:
        return pd.DataFrame(columns=["start_time", "generation_mw"])
    frame["start_time"] = pd.to_datetime(frame.start_time, utc=True)
    frame["generation_mw"] = pd.to_numeric(frame.generation_mw, errors="coerce")
    result = frame[["start_time", "generation_mw"]]
    if result.isna().any().any() or (result["generation_mw"] < 0).any():
        raise ValueError("Actual data contains null or negative generation")
    return result.drop_duplicates("start_time").sort_values("start_time")


def normalize_forecasts(rows: list[dict[str, object]]) -> tuple[pd.DataFrame, int]:
    frame = pd.DataFrame(rows).rename(
        columns={
            "startTime": "source_start_time",
            "publishTime": "publish_time",
            "generation": "generation_mw",
        }
    )
    if frame.empty:
        return pd.DataFrame(columns=["start_time", "publish_time", "generation_mw"]), 0
    frame["source_start_time"] = pd.to_datetime(frame.source_start_time, utc=True)
    frame["publish_time"] = pd.to_datetime(frame.publish_time, utc=True)
    frame["generation_mw"] = pd.to_numeric(frame.generation_mw, errors="coerce")
    if (
        frame[["source_start_time", "publish_time", "generation_mw"]].isna().any().any()
        or (frame["generation_mw"] < 0).any()
    ):
        raise ValueError("Forecast data contains null or negative generation")
    first = frame[["source_start_time", "publish_time", "generation_mw"]].rename(
        columns={"source_start_time": "start_time"}
    )
    second = first.assign(start_time=first.start_time + pd.Timedelta(minutes=30))
    expanded = pd.concat([first, second], ignore_index=True)
    duplicate_count = int(expanded.duplicated(["start_time", "publish_time"]).sum())
    return (
        expanded.drop_duplicates(["start_time", "publish_time"]).sort_values(
            ["start_time", "publish_time"]
        ),
        duplicate_count,
    )


def build_snapshot(path: Path) -> dict[str, int]:
    client = ElexonClient()
    actual_rows: list[dict[str, object]] = []
    current = START
    while current <= END:
        actual_rows.extend(client.actual_day(current))
        current += timedelta(days=1)
    forecast_rows = client.forecast_window(
        datetime.combine(START - timedelta(days=1), time.min, timezone.utc),
        datetime.combine(END + timedelta(days=2), time.min, timezone.utc),
    )
    actuals = normalize_actuals(actual_rows)
    forecasts, duplicate_count = normalize_forecasts(forecast_rows)
    forecasts = forecasts[
        (forecasts.start_time.dt.date >= START) & (forecasts.start_time.dt.date <= END)
    ]
    missing_slots = sum(
        max(0, 48 - len(group))
        for _, group in actuals.assign(day=actuals.start_time.dt.date).groupby("day")
    )
    path.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(path) as connection:
        actuals.to_sql("actuals", connection, if_exists="replace", index=False)
        forecasts.to_sql("forecasts", connection, if_exists="replace", index=False)
        metadata = pd.DataFrame(
            [
                ("start_date", START.isoformat()),
                ("end_date", END.isoformat()),
                ("actual_count", str(len(actuals))),
                ("forecast_count", str(len(forecasts))),
                ("missing_slots", str(missing_slots)),
                ("duplicate_publish_rows", str(duplicate_count)),
                (
                    "resolution_notes",
                    "FUELHH is 30-minute. WINDFOR is hourly in the live response; each hourly forecast is applied to the hour start and the following half-hour slot.",
                ),
            ],
            columns=["key", "value"],
        )
        metadata.to_sql("metadata", connection, if_exists="replace", index=False)
    return {
        "actuals": len(actuals),
        "forecasts": len(forecasts),
        "missing_slots": missing_slots,
    }
