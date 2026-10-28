import math
import pandas as pd

BUCKETS = (
    (0, 6, "0-6h"),
    (6, 12, "6-12h"),
    (12, 24, "12-24h"),
    (24, 36, "24-36h"),
    (36, 48, "36-48h"),
    (48, math.inf, "48h+"),
)


def metrics(frame: pd.DataFrame) -> dict[str, float | int | None]:
    values = frame.dropna(subset=["actual_mw", "forecast_mw"])
    if values.empty:
        return {"mae": None, "bias": None, "n_slots": 0}
    error = values.actual_mw - values.forecast_mw
    return {
        "mae": float(error.abs().mean()),
        "bias": float(error.mean()),
        "n_slots": int(len(values)),
    }


def with_horizon(frame: pd.DataFrame) -> pd.DataFrame:
    result = frame.copy()
    result["horizon_hours"] = (
        result.start_time - result.publish_time
    ).dt.total_seconds() / 3600
    result = result[result.horizon_hours >= 0]
    result["bucket"] = result.horizon_hours.apply(
        lambda value: next(label for low, high, label in BUCKETS if low <= value < high)
    )
    return result


def error_distribution(frame: pd.DataFrame, width: float = 1000.0) -> dict[str, object]:
    values = frame.error_mw.dropna()
    if values.empty:
        return {"bins": [], "bin_width": width}
    low = math.floor(float(values.min()) / width) * width
    high = math.ceil(float(values.max()) / width) * width + width
    edges = [low + index * width for index in range(int((high - low) / width) + 1)]
    return {
        "bins": [
            {
                "lower": edge,
                "upper": edge + width,
                "count": int(((values >= edge) & (values < edge + width)).sum()),
            }
            for edge in edges[:-1]
        ],
        "bin_width": width,
    }
