import math
import pandas as pd

BUCKETS = ((0, 6, "0-6h"), (6, 12, "6-12h"), (12, 24, "12-24h"), (24, 36, "24-36h"), (36, 48, "36-48h"), (48, math.inf, "48h+"))


def metrics(frame: pd.DataFrame) -> dict[str, float | int | None]:
    values = frame.dropna(subset=["actual_mw", "forecast_mw"])
    if values.empty:
        return {"mae": None, "rmse": None, "bias": None, "mape": None, "normalized_mae": None, "median_abs_error": None, "p90_abs_error": None, "p95_abs_error": None, "p05_error": None, "p95_error": None, "under_forecast_share": None, "n_slots": 0}
    error = values.actual_mw - values.forecast_mw
    absolute = error.abs()
    nonzero = values.actual_mw != 0
    return {"mae": float(absolute.mean()), "rmse": float((error.pow(2).mean()) ** 0.5), "bias": float(error.mean()), "mape": float((absolute[nonzero] / values.loc[nonzero, "actual_mw"].abs()).mean() * 100) if nonzero.any() else None, "normalized_mae": float(absolute.mean() / values.actual_mw.mean()) if values.actual_mw.mean() else None, "median_abs_error": float(absolute.quantile(.5)), "p90_abs_error": float(absolute.quantile(.9)), "p95_abs_error": float(absolute.quantile(.95)), "p05_error": float(error.quantile(.05)), "p95_error": float(error.quantile(.95)), "under_forecast_share": float((error > 0).mean()), "n_slots": int(len(values))}


def with_horizon(frame: pd.DataFrame) -> pd.DataFrame:
    result = frame.copy()
    result["horizon_hours"] = (result.start_time - result.publish_time).dt.total_seconds() / 3600
    result = result[result.horizon_hours >= 0]
    result["bucket"] = result.horizon_hours.apply(lambda value: next(label for low, high, label in BUCKETS if low <= value < high))
    return result


def error_distribution(frame: pd.DataFrame, width: float = 1000.0) -> dict[str, object]:
    values = frame.error_mw.dropna()
    if values.empty:
        return {"bins": [], "bin_width": width}
    low = math.floor(float(values.min()) / width) * width
    high = math.ceil(float(values.max()) / width) * width + width
    edges = [low + index * width for index in range(int((high - low) / width) + 1)]
    return {"bins": [{"lower": edge, "upper": edge + width, "count": int(((values >= edge) & (values < edge + width)).sum())} for edge in edges[:-1]], "bin_width": width}

    values = frame.error_mw.dropna()
    values = values[values > 0]
    return float(values.quantile(confidence)) if not values.empty else None


