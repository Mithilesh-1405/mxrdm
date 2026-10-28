from datetime import date
from typing import Any
import pandas as pd
from fastapi import APIRouter, Query
from backend.app.config import settings
from backend.app.errors import error
from backend.schemas import (
    AccuracyMetrics,
    DailyAccuracy,
    ErrorDistribution,
    HorizonAccuracy,
)
from backend.services.api_data import daily_frame, valid_cutoff, valid_date
from backend.services.metrics import error_distribution, metrics, with_horizon
from backend.app.data import repository

router = APIRouter(prefix="/api/v1/accuracy")


@router.get("/summary", response_model=AccuracyMetrics)
def accuracy_summary(
    cutoff: str = Query(settings.default_cutoff),
    start: str = Query("2026-01-01"),
    end: str = Query("2026-01-31"),
) -> Any:
    try:
        parsed_start = valid_date(start, "start")
        parsed_end = valid_date(end, "end")
        if parsed_start > parsed_end:
            return error("invalid_request", "start must be on or before end")
        return metrics(daily_frame(valid_cutoff(cutoff), parsed_start, parsed_end))
    except (FileNotFoundError, ValueError) as exc:
        return error(
            "invalid_request",
            str(exc),
            503 if isinstance(exc, FileNotFoundError) else 400,
        )


@router.get("/daily", response_model=list[DailyAccuracy])
def daily(cutoff: str = Query(settings.default_cutoff)) -> Any:
    frame = daily_frame(valid_cutoff(cutoff), date(2026, 1, 1), date(2026, 1, 31))
    return [
        {
            "delivery_date": date(2026, 1, 1) + pd.Timedelta(days=index),
            **metrics(
                frame[
                    frame.start_time.dt.date
                    == date(2026, 1, 1) + pd.Timedelta(days=index)
                ]
            ),
        }
        for index in range(31)
    ]


@router.get("/by-horizon", response_model=list[HorizonAccuracy])
def by_horizon(cutoff: str = Query(settings.default_cutoff)) -> Any:
    valid_cutoff(cutoff)
    forecasts = repository().forecasts()
    actuals = repository().actuals().rename(columns={"generation_mw": "actual_mw"})
    frame = with_horizon(
        forecasts.merge(actuals, on="start_time", how="left").rename(
            columns={"generation_mw": "forecast_mw"}
        )
    )
    buckets = ["0-6h", "6-12h", "12-24h", "24-36h", "36-48h", "48h+"]
    return [
        {"bucket": bucket, **metrics(frame[frame.bucket == bucket])}
        for bucket in buckets
    ]


@router.get("/error-distribution", response_model=ErrorDistribution)
def distribution(cutoff: str = Query(settings.default_cutoff)) -> Any:
    return error_distribution(
        daily_frame(valid_cutoff(cutoff), date(2026, 1, 1), date(2026, 1, 31))
    )
