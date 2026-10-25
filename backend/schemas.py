from datetime import date, datetime
from pydantic import BaseModel

class ErrorDetail(BaseModel):
    code: str
    message: str

class ErrorResponse(BaseModel):
    error: ErrorDetail

class DecisionRow(BaseModel):
    start_time: datetime
    forecast_mw: float | None
    publish_time: datetime | None
    horizon_hours: float | None
    actual_mw: float | None
    error_mw: float | None

class DecisionSummary(BaseModel):
    total_forecast_mwh: float | None
    total_actual_mwh: float | None
    avg_forecast_mw: float | None
    peak_forecast_mw: float | None
    min_forecast_mw: float | None
    completeness_pct: float
    mean_horizon_hours: float | None

class DecisionView(BaseModel):
    delivery_date: date
    cutoff: str
    rows: list[DecisionRow]
    summary: DecisionSummary
