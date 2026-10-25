import {
  useAccuracySummary,
  useDailyAccuracy,
  useErrorDistribution,
  useHorizonAccuracy,
} from "../api/hooks";
import { BarChart, SimpleChart } from "../components/charts";
import { MetricTable } from "../components/tables";
import {
  EmptyState,
  ErrorState,
  Kpi,
  LoadingState,
  PageHeading,
  Panel,
} from "../components/ui";
import { formatNumber } from "../utils/formatters";

const SHORTFALL_COLOR = "#c45345";
const SURPLUS_COLOR = "#0f766e";

export function AccuracyPage({ cutoff }) {
  const summary = useAccuracySummary(cutoff);
  const daily = useDailyAccuracy(cutoff);
  const horizons = useHorizonAccuracy(cutoff);
  const distribution = useErrorDistribution(cutoff);
  const queries = [summary, daily, horizons, distribution];
  if (queries.some((query) => query.isLoading)) return <LoadingState />;
  const failure = queries.find((query) => query.error);
  if (failure) return <ErrorState message={failure.error.message} />;
  if (!daily.data.length) return <EmptyState />;

  const { mae, bias, n_slots: slots } = summary.data;
  const shortfall = bias < 0;
  const direction = shortfall ? "below" : "above";
  const distributionData = distribution.data.bins.map((row) => ({
    label: `${row.lower / 1000}k`,
    value: row.count,
    unit: "slots",
    fill: row.upper <= 0 ? SHORTFALL_COLOR : SURPLUS_COLOR,
  }));

  return (
    <>
      <PageHeading kicker="Model performance" title="Forecast Accuracy" />
      <Panel
        title="What this means for your purchase"
        subtitle={`Across every half-hour in January, using the forecast available at ${cutoff} on the day before delivery.`}
      >
        <div className="copy-block">
          <p>
            The forecast was typically wrong by about{" "}
            <strong>{formatNumber(mae)} MW</strong>, in either direction. Allow
            for an error of this size when deciding how much extra power to buy.
          </p>
          <p>
            On average, actual wind came in{" "}
            <strong>
              {formatNumber(Math.abs(bias))} MW {direction}
            </strong>{" "}
            the forecast.{" "}
            {shortfall
              ? "Wind was usually lower than forecast, so more power than the forecast alone suggested usually had to be bought."
              : "Wind was usually higher than forecast, so less power than the forecast alone suggested usually had to be bought."}
          </p>
        </div>
      </Panel>
      <div className="kpi-grid">
        <Kpi
          label="Typical error (MAE)"
          value={formatNumber(mae)}
          unit="MW"
          accent
          detail="Average size of the miss, in either direction"
        />
        <Kpi
          label="Average direction (Bias)"
          value={formatNumber(Math.abs(bias))}
          unit={`MW ${direction} forecast`}
          detail={
            shortfall
              ? "Wind was usually lower than forecast"
              : "Wind was usually higher than forecast"
          }
        />
        <Kpi
          label="Half-hours evaluated"
          value={formatNumber(slots)}
          unit="slots"
          detail="Each slot is 30 minutes"
        />
      </div>
      <div className="chart-grid">
        <Panel
          title="Daily MAE"
          subtitle="The average size of the forecast miss each day, in MW. Lower is better."
        >
          <SimpleChart
            data={daily.data.map((row) => ({
              ...row,
              day: row.delivery_date.slice(8),
              value: row.mae,
            }))}
            x="day"
            y="value"
            name="MAE"
            color="#0f766e"
          />
        </Panel>
        <Panel
          title="Error by horizon"
          subtitle="Average miss in MW by how long before delivery the forecast was published, from 0-6h to 48h+."
        >
          <BarChart
            data={horizons.data.map((row) => ({
              label: row.bucket,
              value: row.mae,
            }))}
            x="label"
            y="value"
            name="MAE"
            color="#e2a73b"
          />
        </Panel>
        <Panel
          title="Error distribution"
          subtitle="How many half-hours fell into each error range, in thousand MW. Red: wind was lower than forecast, so extra power was needed. Green: wind was higher."
        >
          <BarChart
            data={distributionData}
            x="label"
            y="value"
            name="Half-hours"
            color={SURPLUS_COLOR}
          />
        </Panel>
      </div>
      <Panel
        title="Day-by-day results"
        subtitle="Decision-time forecast compared with actual wind for each delivery day"
      >
        <MetricTable rows={daily.data} />
      </Panel>
    </>
  );
}