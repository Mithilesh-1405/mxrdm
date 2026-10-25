import {
  Bar,
  Cell,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltip } from "./ui";

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
export function SimpleChart({ data, x, y, name, color }) {
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
export function BarChart({ data, x, y, name, color }) {
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
        <Bar dataKey={y} fill={color} radius={[3, 3, 0, 0]} name={name}>{data.map((item, index) => (<Cell key={index} fill={item.fill || color} />))}</Bar>
      </ComposedChart>
    </ResponsiveContainer>
  );
}
