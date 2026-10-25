import { useEffect, useState } from "react";
import {
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertCircle,
  BarChart3,
  CalendarDays,
  Gauge,
  Leaf,
  Menu,
  Moon,
  RefreshCw,
  Sun,
  X,
  Zap,
} from "lucide-react";

import {
  useAccuracySummary,
  useDailyAccuracy,
  useDecisionView,
  useErrorDistribution,
  useHorizonAccuracy,
  useMeta,
} from "./api/hooks";
import "./App.css";

const formatNumber = (value, digits = 0) =>
  value == null || !Number.isFinite(Number(value))
    ? "Unavailable"
    : new Intl.NumberFormat("en-GB", { maximumFractionDigits: digits }).format(
        value,
      );
const formatDate = (value) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
const formatTime = (value) =>
  value
    ? new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(value))
    : "Unavailable";

function useControls(meta) {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const date = params.get("date") || meta?.delivery_dates?.[14] || "2026-01-15";
  const cutoff = params.get("cutoff") || meta?.default_cutoff || "09:00";
  const update = (key, value) => {
    const next = new URLSearchParams(location.search);
    next.set(key, value);
    navigate(`${location.pathname}?${next.toString()}`);
  };
  return {
    date,
    cutoff,
    setDate: (value) => update("date", value),
    setCutoff: (value) => update("cutoff", value),
  };
}

function App() {
  const meta = useMeta();
  const controls = useControls(meta.data);
  const [dark, setDark] = useState(
    () => localStorage.getItem("wind-theme") === "dark",
  );
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    localStorage.setItem("wind-theme", dark ? "dark" : "light");
  }, [dark]);
  return (
    <div className="app-shell">
      <Header dark={dark} onTheme={() => setDark((value) => !value)} />
      <div className="app-body">
        <Sidebar />
        <main className="main-content">
          <ControlBar meta={meta.data} controls={controls} />
          {meta.isLoading ? (
            <LoadingState />
          ) : meta.error ? (
            <ErrorState message={meta.error.message} />
          ) : (
            <Routes>
              <Route path="/" element={<DecisionPage {...controls} />} />
              <Route
                path="/accuracy"
                element={<AccuracyPage cutoff={controls.cutoff} />}
              />
            </Routes>
          )}
        </main>
      </div>
    </div>
  );
}

function Header({ dark, onTheme }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="topbar">
      <Link className="brand" to="/">
        <span className="brand-mark">
          <Leaf size={18} />
        </span>
        <span>
          Northline <strong>Wind Desk</strong>
        </span>
      </Link>
      <div className="topbar-actions">
        <span className="status-dot">
          <i /> Snapshot online
        </span>
        <button
          className="icon-button"
          onClick={onTheme}
          aria-label="Toggle color theme"
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button
          className="icon-button menu-button"
          onClick={() => setOpen((value) => !value)}
          aria-label="Toggle navigation"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {open && (
        <nav className="mobile-nav">
          <NavItems onClick={() => setOpen(false)} />
        </nav>
      )}
    </header>
  );
}
function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-label">Workspace</div>
      <NavItems />
      <div className="sidebar-foot">
        <div className="live-badge">
          <span /> January 2026 scope
        </div>
        <p>Decision support for day-ahead wind procurement.</p>
      </div>
    </aside>
  );
}
function NavItems({ onClick }) {
  return (
    <nav className="nav-items">
      <NavLink onClick={onClick} to="/" end>
        <Gauge size={17} />
        Decision View
      </NavLink>
      <NavLink onClick={onClick} to="/accuracy">
        <BarChart3 size={17} />
        Forecast Accuracy
      </NavLink>
    </nav>
  );
}
function ControlBar({ meta, controls }) {
  return (
    <section className="control-bar">
      <div className="control-intro">
        <span className="eyebrow">Decision controls</span>
        <span className="control-scope">January 2026 delivery</span>
      </div>
      <div className="controls">
        <label>
          <CalendarDays size={15} />
          Delivery date
          <select
            value={controls.date}
            onChange={(event) => controls.setDate(event.target.value)}
          >
            {(meta?.delivery_dates || []).map((value) => (
              <option key={value} value={value}>
                {formatDate(value)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Cutoff
          <input
            type="time"
            value={controls.cutoff}
            onChange={(event) => controls.setCutoff(event.target.value)}
          />
        </label>
      </div>
    </section>
  );
}
function PageHeading({ kicker, title, children }) {
  return (
    <div className="page-heading">
      <div>
        <span className="eyebrow">{kicker}</span>
        <h1>{title}</h1>
      </div>
      {children}
    </div>
  );
}
function Panel({ title, subtitle, children }) {
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
function LoadingState() {
  return (
    <div className="state-box">
      <RefreshCw className="spin" size={22} />
      <span>Loading market snapshot</span>
    </div>
  );
}
function ErrorState({ message }) {
  return (
    <div className="state-box error-state">
      <AlertCircle size={22} />
      <span>{message || "The snapshot could not be loaded."}</span>
    </div>
  );
}
function EmptyState() {
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
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <strong>{label}</strong>
      {payload.map((item) => (
        <div key={item.dataKey} style={{ color: item.color }}>
          <span>{item.name || item.dataKey}</span>
          <b>{formatNumber(item.value)} MW</b>
        </div>
      ))}
    </div>
  );
}

function DecisionPage({ date, cutoff }) {
  const decision = useDecisionView(date, cutoff);
  const accuracy = useAccuracySummary(cutoff);
  if (decision.isLoading || accuracy.isLoading) return <LoadingState />;
  if (decision.error || accuracy.error)
    return <ErrorState message={(decision.error || accuracy.error).message} />;
  if (!decision.data.rows.length) return <EmptyState />;
  const data = decision.data;
  const chartData = data.rows.map((row) => ({
    ...row,
    time: formatTime(row.start_time),
    lower:
      row.forecast_mw == null || accuracy.data.p05_error == null
        ? null
        : row.forecast_mw + accuracy.data.p05_error,
    upper:
      row.forecast_mw == null || accuracy.data.p95_error == null
        ? null
        : row.forecast_mw + accuracy.data.p95_error,
  }));
  return (
    <>
      <PageHeading kicker="Day-ahead position" title="Decision View" />
      <div className="notice">
        <Zap size={17} />
        <span>
          Forecast used: latest published at or before <strong>{cutoff}</strong>{" "}
          on the previous day. Positive error means actual wind exceeded
          forecast and more power may need to be bought.
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

export function DecisionChart({ data }) {
  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height={360}>
        <ComposedChart
          data={data}
          margin={{ top: 10, right: 12, left: -12, bottom: 4 }}
        >
          <CartesianGrid vertical={false} stroke="var(--grid)" />
          <XAxis
            dataKey="time"
            tickLine={false}
            axisLine={false}
            interval={5}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${Math.round(value / 1000)}k`}
          />
          <Tooltip content={<ChartTooltip />} />
          <Line
            dataKey="forecast_mw"
            stroke="#0f766e"
            strokeWidth={3}
            dot={false}
            name="Forecast"
          />
          <Line
            dataKey="actual_mw"
            stroke="#1d3557"
            strokeWidth={2}
            dot={false}
            name="Actual"
            connectNulls={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
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

function AccuracyPage({ cutoff }) {
  const summary = useAccuracySummary(cutoff);
  const daily = useDailyAccuracy(cutoff);
  const horizons = useHorizonAccuracy(cutoff);
  const distribution = useErrorDistribution(cutoff);
  if ([summary, daily, horizons, distribution].some((query) => query.isLoading))
    return <LoadingState />;
  const failure = [summary, daily, horizons, distribution].find(
    (query) => query.error,
  );
  if (failure) return <ErrorState message={failure.error.message} />;
  if (!daily.data.length) return <EmptyState />;
  return (
    <>
      <PageHeading kicker="Model performance" title="Forecast Accuracy" />
      <div className="kpi-grid">
        <Kpi
          label="MAE"
          value={formatNumber(summary.data.mae)}
          unit="MW"
          accent
        />
        <Kpi label="RMSE" value={formatNumber(summary.data.rmse)} unit="MW" />
        <Kpi label="Bias" value={formatNumber(summary.data.bias)} unit="MW" />
        <Kpi
          label="P90 abs error"
          value={formatNumber(summary.data.p90_abs_error)}
          unit="MW"
        />
        <Kpi
          label="P95 abs error"
          value={formatNumber(summary.data.p95_abs_error)}
          unit="MW"
        />
      </div>
      <div className="chart-grid">
        <Panel title="Daily MAE" subtitle="Error across January">
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
          subtitle="Forecast vintage horizon buckets"
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
          subtitle="Positive error means under-forecast wind"
        >
          <BarChart
            data={distribution.data.bins.map((row) => ({
              label: `${row.lower / 1000}k`,
              value: row.count,
            }))}
            x="label"
            y="value"
            name="Slots"
            color="#7967a9"
          />
        </Panel>
      </div>
      <Panel
        title="Per-day metrics"
        subtitle="Decision-time selection across January"
      >
        <MetricTable rows={daily.data} />
      </Panel>
    </>
  );
}
function SimpleChart({ data, x, y, name, color }) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <ComposedChart
        data={data}
        margin={{ top: 10, right: 8, left: -16, bottom: 4 }}
      >
        <CartesianGrid vertical={false} stroke="var(--grid)" />
        <XAxis dataKey={x} tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} />
        <Tooltip content={<ChartTooltip />} />
        <Line
          dataKey={y}
          stroke={color}
          strokeWidth={2.5}
          dot={false}
          name={name}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
function BarChart({ data, x, y, name, color }) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <ComposedChart
        data={data}
        margin={{ top: 10, right: 8, left: -16, bottom: 4 }}
      >
        <CartesianGrid vertical={false} stroke="var(--grid)" />
        <XAxis dataKey={x} tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} />
        <Tooltip content={<ChartTooltip />} />
        <Bar dataKey={y} fill={color} radius={[3, 3, 0, 0]} name={name} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
function MetricTable({ rows }) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>MAE</th>
            <th>RMSE</th>
            <th>Bias</th>
            <th>P95 abs error</th>
            <th>Slots</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.delivery_date}>
              <td>{formatDate(row.delivery_date)}</td>
              <td>{formatNumber(row.mae)} MW</td>
              <td>{formatNumber(row.rmse)} MW</td>
              <td>{formatNumber(row.bias)} MW</td>
              <td>{formatNumber(row.p95_abs_error)} MW</td>
              <td>{row.n_slots}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
