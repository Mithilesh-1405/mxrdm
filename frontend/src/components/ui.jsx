import { AlertCircle, RefreshCw } from "lucide-react";
import { formatNumber } from "../utils/formatters";

export function PageHeading({ kicker, title }) {
  return (
    <div className="page-heading">
      <div>
        <span className="eyebrow">{kicker}</span>
        <h1>{title}</h1>
      </div>
    </div>
  );
}
export function Panel({ title, subtitle, children }) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}
export function LoadingState() {
  return (
    <div className="state-box">
      <RefreshCw className="spin" size={22} />
      <span>Loading market snapshot</span>
    </div>
  );
}
export function ErrorState({ message }) {
  return (
    <div className="state-box error-state">
      <AlertCircle size={22} />
      <span>{message || "The snapshot could not be loaded."}</span>
    </div>
  );
}
export function EmptyState() {
  return (
    <div className="state-box">
      <span>No data available for this view.</span>
    </div>
  );
}
export function Kpi({ label, value, unit, accent = false, detail }) {
  return (
    <article className={`kpi ${accent ? "accent-kpi" : ""}`}>
      <span>{label}</span>
      <strong>
        {value}
        <small>{unit}</small>
      </strong>
      {detail && <em>{detail}</em>}
    </article>
  );
}
export function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <strong>{label}</strong>
      {payload.map((item) => (
        <div key={item.dataKey} style={{ color: item.color }}>
          <span>{item.name || item.dataKey}</span>
          <b>{formatNumber(item.value)} {item.payload?.unit || "MW"}</b>
        </div>
      ))}
    </div>
  );
}
