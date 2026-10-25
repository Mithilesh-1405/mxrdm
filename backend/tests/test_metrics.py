import pandas as pd
from backend.services.metrics import metrics, with_horizon, error_distribution

def test_metrics_fixture():
    result = metrics(pd.DataFrame({"actual_mw": [10.0, 20.0], "forecast_mw": [8.0, 24.0], "error_mw": [2.0, -4.0]}))
    assert result["mae"] == 3.0
    assert result["bias"] == -1.0
    assert result["n_slots"] == 2

def test_horizon_buckets():
    frame = pd.DataFrame({"start_time": pd.to_datetime(["2026-01-01T00:00:00Z"] * 3), "publish_time": pd.to_datetime(["2025-12-31T23:30:00Z", "2025-12-31T18:30:00Z", "2025-12-31T12:30:00Z"]), "generation_mw": [1, 2, 3], "actual_mw": [2, 3, 4]})
    assert list(with_horizon(frame).bucket) == ["0-6h", "0-6h", "6-12h"]

def test_error_distribution():
    result = error_distribution(pd.DataFrame({"error_mw": [-100.0, 100.0, 1100.0]}), 1000.0)
    assert sum(item["count"] for item in result["bins"]) == 3
