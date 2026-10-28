from datetime import date, datetime, timedelta
from functools import lru_cache
import json
from typing import Any
import pandas as pd
from backend.app.config import settings
from backend.app.data import repository
from backend.services.forecast_selection import select_decision


def valid_date(value: str, name: str) -> date:
    try:
        result = date.fromisoformat(value)
    except ValueError as exc:
        raise ValueError(f"{name} must use YYYY-MM-DD format") from exc
    if result.year != 2026 or result.month != 1:
        raise ValueError(f"{name} must be within January 2026")
    return result


def valid_cutoff(value: str) -> str:
    try:
        parsed = datetime.strptime(value, "%H:%M")
    except ValueError as exc:
        raise ValueError("cutoff must use HH:MM format") from exc
    if parsed.strftime("%H:%M") != value:
        raise ValueError("cutoff must use HH:MM format")
    return value


def daily_frame(cutoff: str, start: date, end: date) -> pd.DataFrame:
    actuals = repository().actuals()
    forecasts = repository().forecasts()
    frames = [
        select_decision(actuals, forecasts, start + timedelta(days=index), cutoff)
        for index in range((end - start).days + 1)
    ]
    return pd.concat(frames, ignore_index=True)


def json_value(value: Any) -> Any:
    if pd.isna(value):
        return None
    if hasattr(value, "to_pydatetime"):
        return value.to_pydatetime().isoformat()
    return value


def decision_data(delivery_date: date, cutoff: str) -> dict[str, Any]:
    frame = select_decision(
        repository().actuals(), repository().forecasts(), delivery_date, cutoff
    )
    complete = frame.dropna(subset=["forecast_mw"])
    rows = [
        {
            key: json_value(value)
            for key, value in {
                "start_time": row.start_time,
                "forecast_mw": row.forecast_mw,
                "publish_time": row.publish_time,
                "horizon_hours": row.horizon_hours,
                "actual_mw": row.actual_mw,
                "error_mw": row.error_mw,
            }.items()
        }
        for row in frame.itertuples()
    ]
    summary = {
        "total_forecast_mwh": (
            float(complete.forecast_mw.sum() * 0.5) if not complete.empty else None
        ),
        "total_actual_mwh": (
            float(frame.actual_mw.dropna().sum() * 0.5)
            if frame.actual_mw.notna().any()
            else None
        ),
        "avg_forecast_mw": (
            float(complete.forecast_mw.mean()) if not complete.empty else None
        ),
        "peak_forecast_mw": (
            float(complete.forecast_mw.max()) if not complete.empty else None
        ),
        "min_forecast_mw": (
            float(complete.forecast_mw.min()) if not complete.empty else None
        ),
        "completeness_pct": float(len(complete) / 48 * 100),
        "mean_horizon_hours": (
            float(complete.horizon_hours.mean()) if not complete.empty else None
        ),
    }
    return {
        "delivery_date": delivery_date.isoformat(),
        "cutoff": cutoff,
        "rows": rows,
        "summary": summary,
    }


@lru_cache(maxsize=128)
def cached_decision(delivery_date: str, cutoff: str) -> str:
    return json.dumps(decision_data(date.fromisoformat(delivery_date), cutoff))


def meta_data() -> dict[str, Any]:
    values = repository().metadata()
    return {
        "delivery_dates": [date(2026, 1, 1) + timedelta(days=i) for i in range(31)],
        "coverage": {"start": values["start_date"], "end": values["end_date"]},
        "default_cutoff": settings.default_cutoff,
        "row_counts": {
            "actuals": int(values["actual_count"]),
            "forecasts": int(values["forecast_count"]),
        },
        "data_quality": {
            "missing_slots": int(values["missing_slots"]),
            "duplicate_publish_rows": int(values["duplicate_publish_rows"]),
            "resolution_notes": values["resolution_notes"],
        },
    }
