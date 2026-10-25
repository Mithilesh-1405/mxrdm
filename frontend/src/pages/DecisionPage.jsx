import { Zap } from "lucide-react";
import { useDecisionView } from "../api/hooks";
import { formatNumber, formatTime } from "../utils/formatters";
import { DecisionChart } from "../components/charts";
import { DecisionTable } from "../components/tables";
import {
  EmptyState,
  ErrorState,
  Kpi,
  LoadingState,
  PageHeading,
  Panel,
} from "../components/ui";

export function DecisionPage({ date, cutoff }) {
  const decision = useDecisionView(date, cutoff);
  if (decision.isLoading) return <LoadingState />;
  if (decision.error) return <ErrorState message={decision.error.message} />;
  if (!decision.data.rows.length) return <EmptyState />;
  const data = decision.data;
  const chartData = data.rows.map((row) => ({
    ...row,
    time: formatTime(row.start_time),
  }));
  return (
    <>
      <PageHeading kicker="Day-ahead position" title="Decision View" />
      <div className="notice">
        <Zap size={17} />
        <span>
          Forecast used: latest published at or before <strong>{cutoff}</strong>{" "}
          on the previous day. Negative error means actual wind was lower than forecast, so extra power may need to be bought; positive means wind was higher than forecast.
        </span>
      </div>
      <div className="kpi-grid">
        <Kpi
          label="Forecast total"
          value={formatNumber(data.summary.total_forecast_mwh)}
          unit="MWh"
          accent
        />
        <Kpi
          label="Average wind"
          value={formatNumber(data.summary.avg_forecast_mw)}
          unit="MW"
        />
        <Kpi
          label="Peak forecast"
          value={formatNumber(data.summary.peak_forecast_mw)}
          unit="MW"
        />
        <Kpi
          label="Completeness"
          value={formatNumber(data.summary.completeness_pct, 1)}
          unit="%"
          detail="48 half-hour slots"
        />
      </div>
      <Panel
        title="Decision-time wind profile"
        subtitle="Decision forecast, actual outturn, and historical error envelope"
      >
        <DecisionChart data={chartData} />
      </Panel>
      <Panel
        title="Half-hourly position"
        subtitle="Publication time and forecast horizon for each slot"
      >
        <DecisionTable rows={data.rows} />
      </Panel>
    </>
  );
}
