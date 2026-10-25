from datetime import date, datetime, timedelta
from functools import lru_cache
import json
import logging
from typing import Any
import pandas as pd
from fastapi import FastAPI, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from backend.app.config import settings
from backend.app.data import repository
from backend.services.forecast_selection import select_decision
from backend.services.metrics import error_distribution, metrics, positive_quantile, with_horizon

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
app = FastAPI(title="Wind Forecast Decision API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=list(settings.cors_origins), allow_credentials=True, allow_methods=["*"], allow_headers=["*"])


def error(code: str, message: str, status: int = 400) -> JSONResponse:
    return JSONResponse(status_code=status, content={"error": {"code": code, "message": message}})


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
    frames = [select_decision(actuals, forecasts, start + timedelta(days=index), cutoff) for index in range((end - start).days + 1)]
    return pd.concat(frames, ignore_index=True)


def json_value(value: Any) -> Any:
    if pd.isna(value):
        return None
    if hasattr(value, "to_pydatetime"):
        return value.to_pydatetime().isoformat()
    return value


def decision_data(delivery_date: date, cutoff: str) -> dict[str, Any]:
    frame = select_decision(repository().actuals(), repository().forecasts(), delivery_date, cutoff)
    complete = frame.dropna(subset=["forecast_mw"])
    rows = [{"start_time": json_value(row.start_time), "forecast_mw": json_value(row.forecast_mw), "publish_time": json_value(row.publish_time), "horizon_hours": json_value(row.horizon_hours), "actual_mw": json_value(row.actual_mw), "error_mw": json_value(row.error_mw)} for row in frame.itertuples()]
    return {"delivery_date": delivery_date.isoformat(), "cutoff": cutoff, "rows": rows, "summary": {"total_forecast_mwh": float(complete.forecast_mw.sum() * .5) if not complete.empty else None, "total_actual_mwh": float(frame.actual_mw.dropna().sum() * .5) if frame.actual_mw.notna().any() else None, "avg_forecast_mw": float(complete.forecast_mw.mean()) if not complete.empty else None, "peak_forecast_mw": float(complete.forecast_mw.max()) if not complete.empty else None, "min_forecast_mw": float(complete.forecast_mw.min()) if not complete.empty else None, "completeness_pct": float(len(complete) / 48 * 100), "mean_horizon_hours": float(complete.horizon_hours.mean()) if not complete.empty else None}}


@lru_cache(maxsize=128)
def cached_decision(delivery_date: str, cutoff: str) -> str:
    return json.dumps(decision_data(date.fromisoformat(delivery_date), cutoff))


@app.get("/health")
def health() -> dict[str, str]:
    available = settings.data_path.exists()
    return {"status": "ok" if available else "degraded", "snapshot": "available" if available else "missing"}


@app.get("/api/v1/meta")
def meta() -> dict[str, Any]:
    values = repository().metadata()
    return {"delivery_dates": [date(2026, 1, 1) + timedelta(days=i) for i in range(31)], "coverage": {"start": values["start_date"], "end": values["end_date"]}, "default_cutoff": settings.default_cutoff, "row_counts": {"actuals": int(values["actual_count"]), "forecasts": int(values["forecast_count"])}, "data_quality": {"missing_slots": int(values["missing_slots"]), "duplicate_publish_rows": int(values["duplicate_publish_rows"]), "resolution_notes": values["resolution_notes"]}}


@app.get("/api/v1/forecast/decision-view")
def decision_view(delivery_date: str = Query(...), cutoff: str = Query(settings.default_cutoff)) -> Any:
    try:
        parsed_date = valid_date(delivery_date, "delivery_date")
        return json.loads(cached_decision(parsed_date.isoformat(), valid_cutoff(cutoff)))
    except FileNotFoundError:
        return error("snapshot_missing", "The local data snapshot is not available", 503)
    except ValueError as exc:
        return error("invalid_request", str(exc))


@app.get("/api/v1/forecast/vintages")
def vintages(delivery_date: str = Query(...)) -> Any:
    try:
        parsed = valid_date(delivery_date, "delivery_date")
        frame = repository().forecasts()
        frame = frame[frame.start_time.dt.date == parsed]
        if frame.empty:
            return error("empty_result", "No forecast vintages are available", 404)
        result = []
        for publish_time, group in frame.groupby("publish_time"):
            result.append({"publish_time": publish_time.to_pydatetime(), "points": [{"start_time": row.start_time.to_pydatetime(), "forecast_mw": float(row.generation_mw)} for row in group.itertuples()]})
        return {"delivery_date": parsed, "vintages": result}
    except (FileNotFoundError, ValueError) as exc:
        return error("invalid_request", str(exc), 503 if isinstance(exc, FileNotFoundError) else 400)


@app.get("/api/v1/accuracy/summary")
def accuracy_summary(cutoff: str = Query(settings.default_cutoff), start: str = Query("2026-01-01"), end: str = Query("2026-01-31")) -> Any:
    try:
        parsed_start = valid_date(start, "start")
        parsed_end = valid_date(end, "end")
        if parsed_start > parsed_end:
            return error("invalid_request", "start must be on or before end")
        return metrics(daily_frame(valid_cutoff(cutoff), parsed_start, parsed_end))
    except (FileNotFoundError, ValueError) as exc:
        return error("invalid_request", str(exc), 503 if isinstance(exc, FileNotFoundError) else 400)


@app.get("/api/v1/accuracy/daily")
def daily(cutoff: str = Query(settings.default_cutoff)) -> Any:
    frame = daily_frame(valid_cutoff(cutoff), date(2026, 1, 1), date(2026, 1, 31))
    return [{"delivery_date": date(2026, 1, 1) + timedelta(days=i), **metrics(frame[frame.start_time.dt.date == date(2026, 1, 1) + timedelta(days=i)])} for i in range(31)]


@app.get("/api/v1/accuracy/by-horizon")
def by_horizon(cutoff: str = Query(settings.default_cutoff)) -> Any:
    valid_cutoff(cutoff)
    forecasts = repository().forecasts()
    actuals = repository().actuals().rename(columns={"generation_mw": "actual_mw"})
    frame = with_horizon(forecasts.merge(actuals, on="start_time", how="left").rename(columns={"generation_mw": "forecast_mw"}))
    return [{"bucket": bucket, **metrics(frame[frame.bucket == bucket])} for bucket in ["0-6h", "6-12h", "12-24h", "24-36h", "36-48h", "48h+"]]


@app.get("/api/v1/accuracy/by-hour-of-day")
def by_hour(cutoff: str = Query(settings.default_cutoff)) -> Any:
    frame = daily_frame(valid_cutoff(cutoff), date(2026, 1, 1), date(2026, 1, 31))
    frame["hour"] = frame.start_time.dt.tz_convert("Europe/London").dt.hour
    return [{"hour": hour, **metrics(frame[frame.hour == hour])} for hour in range(24)]


@app.get("/api/v1/accuracy/by-wind-level")
def by_wind(cutoff: str = Query(settings.default_cutoff)) -> Any:
    frame = daily_frame(valid_cutoff(cutoff), date(2026, 1, 1), date(2026, 1, 31))
    labels = ["<5GW", "5-10GW", "10-15GW", "15-20GW", "20GW+"]
    frame["bucket"] = pd.cut(frame.actual_mw, [-float("inf"), 5000, 10000, 15000, 20000, float("inf")], labels=labels)
    return [{"bucket": label, **metrics(frame[frame.bucket == label])} for label in labels]


@app.get("/api/v1/accuracy/error-distribution")
def distribution(cutoff: str = Query(settings.default_cutoff)) -> Any:
    return error_distribution(daily_frame(valid_cutoff(cutoff), date(2026, 1, 1), date(2026, 1, 31)))


@app.get("/api/v1/accuracy/safety-margin")
def safety(confidence: float = Query(.9, gt=0, lt=1), cutoff: str = Query(settings.default_cutoff)) -> Any:
    cutoff = valid_cutoff(cutoff)
    frame = daily_frame(cutoff, date(2026, 1, 1), date(2026, 1, 31))
    daily_values = [{"delivery_date": date(2026, 1, 1) + timedelta(days=i), "buffer_mw": positive_quantile(frame[frame.start_time.dt.date == date(2026, 1, 1) + timedelta(days=i)], confidence)} for i in range(31)]
    return {"confidence": confidence, "overall_buffer_mw": positive_quantile(frame, confidence), "daily": daily_values}


@app.get("/api/v1/export/decision-view.csv")
def export_decision(delivery_date: str = Query(...), cutoff: str = Query(settings.default_cutoff)) -> Response:
    frame = select_decision(repository().actuals(), repository().forecasts(), valid_date(delivery_date, "delivery_date"), valid_cutoff(cutoff))
    return Response(frame.to_csv(index=False), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=decision-view.csv"})


@app.get("/api/v1/export/accuracy.csv")
def export_accuracy(cutoff: str = Query(settings.default_cutoff)) -> Response:
    frame = daily_frame(valid_cutoff(cutoff), date(2026, 1, 1), date(2026, 1, 31))
    return Response(frame.to_csv(index=False), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=accuracy.csv"})


if settings.static_dir and settings.static_dir.exists():
    app.mount("/assets", StaticFiles(directory=settings.static_dir / "assets"), name="assets")


@app.get("/{path:path}")
def spa_fallback(path: str) -> Response:
    if path.startswith("api/") or path == "health":
        return error("not_found", "Route not found", 404)
    if settings.static_dir:
        candidate = settings.static_dir / path
        if candidate.is_file():
            return Response(candidate.read_bytes(), media_type="text/html" if candidate.suffix == ".html" else None)
        index = settings.static_dir / "index.html"
        if index.exists():
            return Response(index.read_bytes(), media_type="text/html")
    return error("not_found", "Route not found", 404)
