"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type ExercisePoint = {
  date: string; // yyyy-mm-dd
  e1rm: number;
  topWeight: number;
  volume: number;
};

const axisProps = {
  stroke: "#97a0b3",
  fontSize: 11,
  tickLine: false,
} as const;

const tooltipStyle = {
  contentStyle: {
    background: "#1a1f29",
    border: "1px solid #37404f",
    borderRadius: 8,
    fontSize: 12,
  },
  labelStyle: { color: "#97a0b3" },
} as const;

function fmtDate(v: string) {
  return new Date(`${v}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function StrengthChart({
  data,
  unit,
}: {
  data: ExercisePoint[];
  unit: string;
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <CartesianGrid stroke="#262c38" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" {...axisProps} axisLine={{ stroke: "#262c38" }} tickFormatter={fmtDate} />
          <YAxis {...axisProps} axisLine={false} domain={["auto", "auto"]} width={48} />
          <Tooltip
            {...tooltipStyle}
            formatter={(value: unknown, name: unknown) => [`${value} ${unit}`, String(name)]}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line
            type="monotone"
            dataKey="e1rm"
            name="Est. 1RM"
            stroke="#e8e3d8"
            strokeWidth={2}
            dot={{ r: 2.5, fill: "#e8e3d8" }}
          />
          <Line
            type="monotone"
            dataKey="topWeight"
            name="Top set"
            stroke="#60a5fa"
            strokeWidth={2}
            dot={{ r: 2.5, fill: "#60a5fa" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function VolumeChart({
  data,
  unit,
}: {
  data: ExercisePoint[];
  unit: string;
}) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
          <CartesianGrid stroke="#262c38" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" {...axisProps} axisLine={{ stroke: "#262c38" }} tickFormatter={fmtDate} />
          <YAxis {...axisProps} axisLine={false} width={56} />
          <Tooltip
            {...tooltipStyle}
            formatter={(value: unknown) => [
              `${Math.round(Number(value)).toLocaleString()} ${unit}`,
              "Volume",
            ]}
            cursor={{ fill: "rgba(232,227,216,0.06)" }}
          />
          <Bar dataKey="volume" name="Volume" fill="#e8e3d8" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
