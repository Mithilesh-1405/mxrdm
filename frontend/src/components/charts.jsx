import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltip } from "./ui";

const chartMargin = { top: 10, right: 12, left: 16, bottom: 34 };

const xAxisLabel = (value) => ({
  value,
  position: "insideBottom",
  offset: -24,
  style: { fill: "var(--muted)", fontSize: 11 },
});

const yAxisLabel = (value) => ({
  value,
  angle: -90,
  position: "insideLeft",
  offset: -6,
  style: { fill: "var(--muted)", fontSize: 11, textAnchor: "middle" },
});

export function DecisionChart({ data }) {
  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height={360}>
        <ComposedChart data={data} margin={chartMargin}>
          <CartesianGrid vertical={false} stroke="var(--grid)" />
          <XAxis
            dataKey="time"
            tickLine={false}
            axisLine={false}
            interval={5}
            label={xAxisLabel("Delivery time (day-ahead)")}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${Math.round(value / 1000)}k`}
            label={yAxisLabel("Wind generation (MW)")}
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

export function SimpleChart({ data, x, y, name, color, xLabel, yLabel }) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <ComposedChart data={data} margin={chartMargin}>
        <CartesianGrid vertical={false} stroke="var(--grid)" />
        <XAxis
          dataKey={x}
          tickLine={false}
          axisLine={false}
          label={xAxisLabel(xLabel)}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          label={yAxisLabel(yLabel)}
        />
        <Tooltip content={<ChartTooltip />} />
        <Line dataKey={y} stroke={color} strokeWidth={2.5} dot={false} name={name} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function BarChart({ data, x, y, name, color, xLabel, yLabel }) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <ComposedChart data={data} margin={chartMargin}>
        <CartesianGrid vertical={false} stroke="var(--grid)" />
        <XAxis
          dataKey={x}
          tickLine={false}
          axisLine={false}
          label={xAxisLabel(xLabel)}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          label={yAxisLabel(yLabel)}
        />
        <Tooltip content={<ChartTooltip />} />
        <Bar dataKey={y} fill={color} radius={[3, 3, 0, 0]} name={name}>
          {data.map((item, index) => (
            <Cell key={index} fill={item.fill || color} />
          ))}
        </Bar>
      </ComposedChart>
    </ResponsiveContainer>
  );
}
