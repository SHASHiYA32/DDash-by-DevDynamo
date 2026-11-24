"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartPoint } from "@/lib/custom";

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  fontSize: 12,
  color: "var(--popover-foreground)",
};
const tick = { fill: "var(--muted-foreground)", fontSize: 12 };
const COLORS = ["var(--chart-2)", "var(--chart-1)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--muted-foreground)"];

const num = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });

export function GenericChart({
  type,
  data,
  valueLabel,
}: {
  type: "bar" | "donut" | "line";
  data: ChartPoint[];
  valueLabel: string;
}) {
  if (data.length === 0) {
    return <p className="grid h-full place-items-center text-sm text-muted-foreground">Add records to see the chart.</p>;
  }

  if (type === "donut") {
    const top = data.slice(0, 5);
    const rest = data.slice(5).reduce((s, d) => s + d.value, 0);
    const slices = rest > 0 ? [...top, { label: "Other", value: rest }] : top;
    const total = slices.reduce((s, d) => s + d.value, 0);
    return (
      <div className="flex h-full flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative mx-auto aspect-square h-full max-h-56 min-h-40 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={slices} dataKey="value" nameKey="label" innerRadius="62%" outerRadius="92%" paddingAngle={3} stroke="none" animationDuration={1000}>
                {slices.map((s, i) => (
                  <Cell key={s.label} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [num(Number(v)), String(n)]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
            <div>
              <div className="text-[11px] text-muted-foreground">{valueLabel}</div>
              <div className="text-base font-semibold tabular-nums">{num(total)}</div>
            </div>
          </div>
        </div>
        <ul className="grid flex-1 gap-2 text-sm">
          {slices.map((s, i) => (
            <li key={s.label} className="flex items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2">
                <span className="size-2.5 shrink-0 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="truncate">{s.label}</span>
              </span>
              <span className="tabular-nums text-muted-foreground">{total ? Math.round((s.value / total) * 100) : 0}%</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const axes = (
    <>
      <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
      <XAxis dataKey="label" tick={tick} tickLine={false} axisLine={false} minTickGap={24} />
      <YAxis tick={tick} tickLine={false} axisLine={false} width={44} allowDecimals={false} />
      <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)", stroke: "var(--border)" }} formatter={(v) => [num(Number(v)), valueLabel]} />
    </>
  );

  return (
    <ResponsiveContainer width="100%" height="100%">
      {type === "line" ? (
        <AreaChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gCustom" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.45} />
              <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
            </linearGradient>
          </defs>
          {axes}
          <Area type="monotone" dataKey="value" stroke="var(--chart-2)" strokeWidth={2.5} fill="url(#gCustom)" animationDuration={1100} />
        </AreaChart>
      ) : (
        <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
          {axes}
          <Bar dataKey="value" fill="var(--chart-2)" radius={[6, 6, 0, 0]} animationDuration={1000} />
        </BarChart>
      )}
    </ResponsiveContainer>
  );
}
