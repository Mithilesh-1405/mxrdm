from datetime import date, datetime
from pydantic import BaseModel

class ErrorDetail(BaseModel):
    code: str
    message: str

class ErrorResponse(BaseModel):
    error: ErrorDetail

class HealthResponse(BaseModel):
    status: str
    snapshot: str

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

class AccuracyMetrics(BaseModel):
    mae: float | None
    bias: float | None
    n_slots: int

class DailyAccuracy(AccuracyMetrics):
    delivery_date: date

class HorizonAccuracy(AccuracyMetrics):
    bucket: str

class DistributionBin(BaseModel):
    lower: float
    upper: float
    count: int

class ErrorDistribution(BaseModel):
    bins: list[DistributionBin]
    bin_width: float

class Coverage(BaseModel):
    start: date
    end: date

class DataQuality(BaseModel):
    missing_slots: int
    duplicate_publish_rows: int
    resolution_notes: str

class MetaResponse(BaseModel):
    delivery_dates: list[date]
    coverage: Coverage
    default_cutoff: str
    row_counts: dict[str, int]
    data_quality: DataQuality
