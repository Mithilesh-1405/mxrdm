from datetime import date, datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo
import pandas as pd

LONDON = ZoneInfo("Europe/London")
UTC = timezone.utc


def parse_cutoff(value: str) -> time:
    try:
        parsed = datetime.strptime(value, "%H:%M").time()
    except ValueError as error:
        raise ValueError("cutoff must use HH:MM format") from error
    if value != parsed.strftime("%H:%M"):
        raise ValueError("cutoff must use HH:MM format")
    return parsed


def decision_timestamp(delivery_date: date, cutoff: str) -> datetime:
    return datetime.combine(delivery_date - timedelta(days=1), parse_cutoff(cutoff), LONDON)


def expected_slots(delivery_date: date) -> pd.DatetimeIndex:
    start = pd.Timestamp(datetime.combine(delivery_date, time.min, LONDON))
    return pd.date_range(start.tz_convert("UTC"), periods=48, freq="30min")


def select_decision(actuals: pd.DataFrame, forecasts: pd.DataFrame, delivery_date: date, cutoff: str) -> pd.DataFrame:
    cutoff_utc = pd.Timestamp(decision_timestamp(delivery_date, cutoff).astimezone(UTC))
    slots = pd.DataFrame({"start_time": expected_slots(delivery_date)})
    available = forecasts[(forecasts.publish_time <= cutoff_utc) & (forecasts.start_time.dt.date == delivery_date)]
    selected = available.sort_values("publish_time").drop_duplicates("start_time", keep="last").rename(columns={"generation_mw": "forecast_mw"})
    actual = actuals[actuals.start_time.dt.date == delivery_date].rename(columns={"generation_mw": "actual_mw"})
    result = slots.merge(selected[["start_time", "publish_time", "forecast_mw"]], on="start_time", how="left").merge(actual[["start_time", "actual_mw"]], on="start_time", how="left")
    result["horizon_hours"] = (result.start_time - result.publish_time).dt.total_seconds() / 3600
    result["error_mw"] = result.actual_mw - result.forecast_mw
    return result


