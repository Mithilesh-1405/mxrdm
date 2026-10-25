import { useState } from "react";
import { formatDate, formatNumber, formatTime } from "../utils/formatters";

export function DecisionTable({ rows }) {
  const [sort, setSort] = useState("start_time");
  const sorted = [...rows].sort((a, b) =>
    String(a[sort]).localeCompare(String(b[sort]), undefined, {
      numeric: true,
    }),
  );
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            {[
              ["start_time", "Start"],
              ["forecast_mw", "Forecast"],
              ["actual_mw", "Actual"],
              ["error_mw", "Error"],
              ["publish_time", "Published"],
              ["horizon_hours", "Horizon"],
            ].map(([key, label]) => (
              <th key={key}>
                <button className="sort-button" onClick={() => setSort(key)}>
                  {label}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={row.start_time}>
              <td>{formatTime(row.start_time)}</td>
              <td>{formatNumber(row.forecast_mw)} MW</td>
              <td>{formatNumber(row.actual_mw)} MW</td>
              <td className={row.error_mw > 0 ? "positive" : "negative"}>
                {formatNumber(row.error_mw)} MW
              </td>
              <td>{formatTime(row.publish_time)}</td>
              <td>{formatNumber(row.horizon_hours, 1)} h</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function MetricTable({ rows }) {
  return (
    <div className="table-scroll">
      <p className="table-help">
        Typical miss (MAE) is the average size of the forecast error that day.
        Average error (Bias) is actual minus forecast. Direction shows whether
        wind came in below the forecast (extra power needed) or above it.
        Half-hours covered is out of 48 per day.
      </p>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Typical miss (MAE)</th>
            <th>Average error (Bias)</th>
            <th>Direction</th>
            <th>Half-hours covered</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.delivery_date}>
              <td>{formatDate(row.delivery_date)}</td>
              <td>{formatNumber(row.mae)} MW</td>
              <td>{formatNumber(row.bias)} MW</td>
              <td className={row.bias < 0 ? "negative" : "positive"}>
                {row.bias == null
                  ? "Unavailable"
                  : row.bias < 0
                    ? "Below forecast"
                    : "Above forecast"}
              </td>
              <td>{row.n_slots} of 48</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}