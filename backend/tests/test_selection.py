from datetime import date
import pandas as pd
from backend.services.forecast_selection import decision_timestamp, select_decision

def test_cutoff_boundary_and_after_cutoff():
    actuals = pd.DataFrame({"start_time": pd.to_datetime(["2026-01-15T00:00:00Z"]), "generation_mw": [100.0]})
    forecasts = pd.DataFrame({"start_time": pd.to_datetime(["2026-01-15T00:00:00Z"] * 3), "publish_time": pd.to_datetime(["2026-01-14T08:00:00Z", "2026-01-14T09:00:00Z", "2026-01-14T10:00:00Z"]), "generation_mw": [80.0, 90.0, 99.0]})
    result = select_decision(actuals, forecasts, date(2026, 1, 15), "09:00")
    assert result.iloc[0].forecast_mw == 90.0
    assert result.iloc[0].publish_time.isoformat() == "2026-01-14T09:00:00+00:00"

def test_timezone_and_missing_slot():
    assert decision_timestamp(date(2026, 1, 15), "09:00").isoformat() == "2026-01-14T09:00:00+00:00"
    actuals = pd.DataFrame({"start_time": pd.to_datetime(["2026-01-15T00:00:00Z"]), "generation_mw": [100.0]})
    forecasts = pd.DataFrame({"start_time": pd.to_datetime(["2026-01-15T00:00:00Z"]), "publish_time": pd.to_datetime(["2026-01-14T08:00:00Z"]), "generation_mw": [80.0]})
    assert pd.isna(select_decision(actuals, forecasts, date(2026, 1, 15), "09:00").iloc[1].forecast_mw)
