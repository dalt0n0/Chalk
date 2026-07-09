"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type MetricPoint = {
  date: string; // yyyy-mm-dd
  weight: number | null;
  bodyFatPct: number | null;
};

export function MetricsChart({
  data,
  unit,
}: {
  data: MetricPoint[];
  unit: string;
}) {
  const hasBf = data.some((d) => d.bodyFatPct !== null);
  const hasWeight = data.some((d) => d.weight !== null);

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <CartesianGrid stroke="#262c38" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="#97a0b3"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: "#262c38" }}
            tickFormatter={(v: string) =>
              new Date(`${v}T12:00:00`).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })
            }
          />
          <YAxis
            yAxisId="weight"
            stroke="#97a0b3"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            domain={["auto", "auto"]}
            width={48}
          />
          {hasBf && (
            <YAxis
              yAxisId="bf"
              orientation="right"
              stroke="#60a5fa"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              domain={["auto", "auto"]}
              width={40}
              tickFormatter={(v: number) => `${v}%`}
            />
          )}
          <Tooltip
            contentStyle={{
              background: "#1a1f29",
              border: "1px solid #37404f",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: "#97a0b3" }}
            formatter={(value, name) => [
              name === "Body fat" ? `${value}%` : `${value} ${unit}`,
              String(name),
            ]}
          />
          {hasWeight && (
            <Line
              yAxisId="weight"
              type="monotone"
              dataKey="weight"
              name="Weight"
              stroke="#e8e3d8"
              strokeWidth={2}
              dot={{ r: 2.5, fill: "#e8e3d8" }}
              connectNulls
            />
          )}
          {hasBf && (
            <Line
              yAxisId="bf"
              type="monotone"
              dataKey="bodyFatPct"
              name="Body fat"
              stroke="#60a5fa"
              strokeWidth={2}
              dot={{ r: 2.5, fill: "#60a5fa" }}
              connectNulls
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
