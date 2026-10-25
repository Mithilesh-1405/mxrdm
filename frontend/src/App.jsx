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
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertCircle,
  ArrowDownToLine,
  BarChart3,
  CalendarDays,
  ChevronRight,
  CircleHelp,
  Gauge,
  Leaf,
  Menu,
  Moon,
  RefreshCw,
  ShieldCheck,
  Sun,
  X,
  Zap,
} from "lucide-react";
import { getAccuracyCsvUrl, getDecisionCsvUrl } from "./api/client";
import {
  useAccuracySummary,
  useDailyAccuracy,
  useDecisionView,
  useErrorDistribution,
  useHourAccuracy,
  useHorizonAccuracy,
  useMeta,
  useSafetyMargin,
  useVintages,
  useWindAccuracy,
} from "./api/hooks";
import "./App.css";

const formatNumber = (value, digits = 0) =>
  value == null
    ? ""
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
    : "";
const percent = (value, digits = 1) =>
  value == null ? "" : `${formatNumber(value, digits)}%`;

function useControls(meta) {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const date = params.get("date") || meta?.delivery_dates?.[14] || "2026-01-15";
  const cutoff = params.get("cutoff") || meta?.default_cutoff || "09:00";
  const confidence = Number(params.get("confidence") || 0.9);
  const update = (key, value) => {
    const next = new URLSearchParams(location.search);
    next.set(key, value);
    navigate(`${location.pathname}?${next.toString()}`);
  };
  return {
    date,
    cutoff,
    confidence,
    setDate: (value) => update("date", value),
    setCutoff: (value) => update("cutoff", value),
    setConfidence: (value) => update("confidence", value),
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
              <Route
                path="/procurement"
                element={<ProcurementPage {...controls} />}
              />
              <Route path="/about" element={<AboutPage meta={meta.data} />} />
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
      <NavLink onClick={onClick} to="/procurement">
        <ShieldCheck size={17} />
        Procurement Guidance
      </NavLink>
      <NavLink onClick={onClick} to="/about">
        <CircleHelp size={17} />
        About & Data Quality
      </NavLink>
    </nav>
  );
}

export function ControlBar({ meta, controls }) {
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
        <label>
          Confidence
          <select
            value={controls.confidence}
            onChange={(event) => controls.setConfidence(event.target.value)}
          >
            <option value="0.8">80%</option>
            <option value="0.9">90%</option>
            <option value="0.95">95%</option>
            <option value="0.99">99%</option>
          </select>
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
function Panel({ title, subtitle, children, className = "" }) {
  return (
    <section className={`panel ${className}`}>
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
  const vintages = useVintages(date);
  const accuracy = useAccuracySummary(cutoff);
  const [showVintages, setShowVintages] = useState(false);
  if (decision.isLoading) return <LoadingState />;
  if (decision.error) return <ErrorState message={decision.error.message} />;
  const data = decision.data;
  const chartData = data.rows.map((row) => ({
    ...row,
    time: formatTime(row.start_time),
    lower:
      row.forecast_mw == null || accuracy.data?.p05_error == null
        ? null
        : row.forecast_mw + accuracy.data.p05_error,
    upper:
      row.forecast_mw == null || accuracy.data?.p95_error == null
        ? null
        : row.forecast_mw + accuracy.data.p95_error,
  }));
  return (
    <>
      <PageHeading kicker="Day-ahead position" title="Decision View">
        <a
          className="button secondary"
          href={getDecisionCsvUrl(date, cutoff)}
          download
        >
          <ArrowDownToLine size={16} />
          Export CSV
        </a>
      </PageHeading>
      <div className="notice">
        <Zap size={17} />
        <span>
          Forecast used: latest published at or before <strong>{cutoff}</strong>{" "}
          on{" "}
          {formatDate(
            new Date(new Date(`${date}T12:00:00`).getTime() - 86400000)
              .toISOString()
              .slice(0, 10),
          )}
          . Positive error means actual wind exceeded forecast and more power
          may need to be bought.
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
          label="Mean horizon"
          value={formatNumber(data.summary.mean_horizon_hours, 1)}
          unit="h"
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
        subtitle="Forecast, actual outturn, and historical error envelope"
      >
        <div className="chart-actions">
          <label className="toggle">
            <input
              type="checkbox"
              checked={showVintages}
              onChange={(event) => setShowVintages(event.target.checked)}
            />
            <span />
            Show other forecast vintages
          </label>
        </div>
        <DecisionChart
          data={chartData}
          vintages={showVintages ? vintages.data?.vintages : []}
        />
      </Panel>
      <Panel
        title="Half-hourly position"
        subtitle="Hover chart points for publication time and horizon"
      >
        <DecisionTable rows={data.rows} />
      </Panel>
    </>
  );
}

export function DecisionChart({ data, vintages = [] }) {
  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height={360}>
        <ComposedChart
          data={data}
          margin={{ top: 10, right: 12, left: -12, bottom: 4 }}
        >
          <defs>
            <linearGradient id="errorBand" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e2a73b" stopOpacity=".25" />
              <stop offset="100%" stopColor="#e2a73b" stopOpacity=".04" />
            </linearGradient>
          </defs>
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
          <Area
            dataKey="upper"
            stroke="none"
            fill="url(#errorBand)"
            name="P95 envelope"
          />
          <Area
            dataKey="lower"
            stroke="none"
            fill="var(--surface)"
            name="P05 envelope"
          />
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
          {vintages?.slice(-4).map((vintage, index) => (
            <Line
              key={vintage.publish_time}
              data={vintage.points.map((point) => ({
                time: formatTime(point.start_time),
                [`v${index}`]: point.forecast_mw,
              }))}
              dataKey={`v${index}`}
              stroke="#8a98a8"
              strokeOpacity={0.25}
              dot={false}
              name="Vintage"
            />
          ))}
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
                  <ChevronRight size={12} />
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
  const hours = useHourAccuracy(cutoff);
  const wind = useWindAccuracy(cutoff);
  const distribution = useErrorDistribution(cutoff);
  if (
    [summary, daily, horizons, hours, wind, distribution].some(
      (query) => query.isLoading,
    )
  )
    return <LoadingState />;
  const failure = [summary, daily, horizons, hours, wind, distribution].find(
    (query) => query.error,
  );
  if (failure) return <ErrorState message={failure.error.message} />;
  const scatter = daily.data.flatMap((day) =>
    day.mae == null
      ? []
      : [
          {
            actual: day.mae,
            forecast: Math.abs(day.bias || 0),
            day: day.delivery_date,
          },
        ],
  );
  return (
    <>
      <PageHeading kicker="Model performance" title="Forecast Accuracy">
        <a
          className="button secondary"
          href={getAccuracyCsvUrl(cutoff)}
          download
        >
          <ArrowDownToLine size={16} />
          Export CSV
        </a>
      </PageHeading>
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
          label="Normalized MAE"
          value={percent(summary.data.normalized_mae * 100)}
        />
        <Kpi
          label="P90 abs error"
          value={formatNumber(summary.data.p90_abs_error)}
          unit="MW"
        />
        <Kpi
          label="Under-forecast share"
          value={percent(summary.data.under_forecast_share * 100)}
        />
      </div>
      <div className="chart-grid">
        <Panel title="Daily MAE" subtitle="How error moved across January">
          <SimpleChart
            data={daily.data.map((row) => ({
              ...row,
              day: row.delivery_date.slice(8),
              mae: row.mae,
            }))}
            x="day"
            y="mae"
            name="MAE"
            color="#0f766e"
          />
        </Panel>
        <Panel
          title="Error by horizon"
          subtitle="All available forecast vintages"
        >
          <BarChart
            data={horizons.data.map((row) => ({
              ...row,
              label: row.bucket,
              value: row.mae,
            }))}
            x="label"
            y="value"
            name="MAE"
            color="#e2a73b"
          />
        </Panel>
        <Panel title="Error by hour" subtitle="Europe/London local time">
          <SimpleChart
            data={hours.data.map((row) => ({
              ...row,
              label: `${row.hour}:00`,
              value: row.mae,
            }))}
            x="label"
            y="value"
            name="MAE"
            color="#1d3557"
          />
        </Panel>
        <Panel title="Error by wind level" subtitle="Actual wind level buckets">
          <BarChart
            data={wind.data.map((row) => ({
              ...row,
              label: row.bucket,
              value: row.mae,
            }))}
            x="label"
            y="value"
            name="MAE"
            color="#d46b47"
          />
        </Panel>
        <Panel
          title="Error distribution"
          subtitle="Positive values indicate under-forecast"
        >
          <BarChart
            data={distribution.data.bins.map((row) => ({
              ...row,
              label: `${row.lower / 1000}k`,
              value: row.count,
            }))}
            x="label"
            y="value"
            name="Slots"
            color="#7967a9"
          />
        </Panel>
        <Panel
          title="Actual versus forecast"
          subtitle="Daily aggregate error view"
        >
          <ResponsiveContainer width="100%" height={250}>
            <ScatterChart margin={{ top: 10, right: 20, left: -12, bottom: 4 }}>
              <CartesianGrid stroke="var(--grid)" />
              <XAxis type="number" dataKey="actual" name="Actual MAE" />
              <YAxis type="number" dataKey="forecast" name="Absolute bias" />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} />
              <Scatter data={scatter} fill="#0f766e" />
            </ScatterChart>
          </ResponsiveContainer>
        </Panel>
      </div>
      <Panel
        title="Per-day metrics"
        subtitle="Full January decision-time selection"
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

function ProcurementPage({ date, cutoff, confidence }) {
  const decision = useDecisionView(date, cutoff);
  const safety = useSafetyMargin(confidence, cutoff);
  if (decision.isLoading || safety.isLoading) return <LoadingState />;
  if (decision.error || safety.error)
    return <ErrorState message={(decision.error || safety.error).message} />;
  const selected = safety.data.daily.find((row) => row.delivery_date === date);
  const buffer = selected?.buffer_mw;
  const forecast = decision.data.summary.avg_forecast_mw;
  return (
    <>
      <PageHeading kicker="Purchase planning" title="Procurement Guidance">
        <span className="confidence-chip">
          {Math.round(confidence * 100)}% confidence
        </span>
      </PageHeading>
      <div className="guidance-hero">
        <div>
          <span className="eyebrow">Recommended safety buffer</span>
          <strong>
            {formatNumber(buffer)} <small>MW</small>
          </strong>
          <p>
            Empirical positive forecast error quantile for {formatDate(date)} at
            the selected confidence. Add this buffer above the wind forecast
            when covering wind shortfall risk.
          </p>
        </div>
        <ShieldCheck size={48} />
      </div>
      <Panel
        title="Scenario view"
        subtitle="No demand assumption is included. This describes wind uncertainty only."
      >
        <table>
          <thead>
            <tr>
              <th>Scenario</th>
              <th>Wind position</th>
              <th>Implied additional purchase</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Selected forecast</td>
              <td>{formatNumber(forecast)} MW average</td>
              <td>Baseline</td>
            </tr>
            <tr>
              <td>Buffer-adjusted low case</td>
              <td>
                {formatNumber(
                  forecast == null || buffer == null ? null : forecast - buffer,
                )}{" "}
                MW average
              </td>
              <td>{formatNumber(buffer)} MW</td>
            </tr>
          </tbody>
        </table>
      </Panel>
      <Panel title="How to read this">
        <div className="copy-block">
          <p>
            The buffer is the empirical {Math.round(confidence * 100)}th
            percentile of positive error, where positive error means actual wind
            was higher than the forecast. It is a wind forecast uncertainty
            allowance, not a demand forecast or a guaranteed procurement volume.
          </p>
          <Link className="text-link" to="/accuracy">
            Review the underlying accuracy metrics <ChevronRight size={15} />
          </Link>
        </div>
      </Panel>
    </>
  );
}

function AboutPage({ meta }) {
  return (
    <>
      <PageHeading kicker="Reference" title="About & Data Quality" />
      <div className="about-grid">
        <Panel title="Data sources">
          <div className="copy-block">
            <p>
              All values come from the Elexon BMRS national wind datasets stored
              in the local snapshot.
            </p>
            <ul>
              <li>FUELHH supplies 30-minute wind generation actuals.</li>
              <li>WINDFOR supplies forecast vintages.</li>
              <li>Runtime requests never depend on live API availability.</li>
            </ul>
          </div>
        </Panel>
        <Panel title="Coverage">
          <div className="quality-list">
            <div>
              <span>Delivery coverage</span>
              <strong>
                {formatDate(meta.coverage.start)}{" "}
                {formatDate(meta.coverage.end)}
              </strong>
            </div>
            <div>
              <span>Actual rows</span>
              <strong>{formatNumber(meta.row_counts.actuals)}</strong>
            </div>
            <div>
              <span>Forecast rows</span>
              <strong>{formatNumber(meta.row_counts.forecasts)}</strong>
            </div>
            <div>
              <span>Missing slots</span>
              <strong>{formatNumber(meta.data_quality.missing_slots)}</strong>
            </div>
            <div>
              <span>Duplicate publish rows</span>
              <strong>
                {formatNumber(meta.data_quality.duplicate_publish_rows)}
              </strong>
            </div>
          </div>
        </Panel>
        <Panel title="Definitions">
          <div className="definition-list">
            <div>
              <b>MAE</b>
              <span>Mean absolute error in MW.</span>
            </div>
            <div>
              <b>RMSE</b>
              <span>Root mean squared error, emphasizing larger misses.</span>
            </div>
            <div>
              <b>Bias</b>
              <span>
                Actual minus forecast. Positive means under-forecast wind.
              </span>
            </div>
            <div>
              <b>MAPE</b>
              <span>Absolute percentage error, guarded for zero actuals.</span>
            </div>
            <div>
              <b>Safety buffer</b>
              <span>
                Positive-error empirical quantile at the chosen confidence.
              </span>
            </div>
          </div>
        </Panel>
        <Panel title="Assumptions">
          <div className="copy-block">
            <p>
              Decision cutoff defaults to {meta.default_cutoff} Europe/London on
              the preceding day. WINDFOR hourly values are aligned to both
              half-hour slots in the hour. Missing forecast slots remain missing
              and are never silently filled.
            </p>
            <p>{meta.data_quality.resolution_notes}</p>
            <p>AI tools were used to assist with building this application.</p>
          </div>
        </Panel>
      </div>
    </>
  );
}

export default App;
