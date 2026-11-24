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
import { fmtLong, fmtShort, type CatTotal, type DayPoint } from "@/lib/analytics";
import { formatMoney } from "@/lib/utils";

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  fontSize: 12,
  color: "var(--popover-foreground)",
  boxShadow: "0 8px 30px rgb(0 0 0 / 0.12)",
};

const tick = { fill: "var(--muted-foreground)", fontSize: 12 };
const SLICES = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--muted-foreground)"];

export function RevenueChart({ data, currency }: { data: DayPoint[]; currency: string }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.45} />
            <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.2} />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tick={tick}
          tickLine={false}
          axisLine={false}
          tickFormatter={(d: string) => fmtShort(d)}
          minTickGap={36}
        />
        <YAxis
          tick={tick}
          tickLine={false}
          axisLine={false}
          width={52}
          tickFormatter={(v: number) => formatMoney(v, currency, true)}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          cursor={{ stroke: "var(--border)" }}
          labelFormatter={(l) => fmtLong(String(l))}
          formatter={(v, name) => [formatMoney(Number(v), currency), String(name)]}
        />
        <Area
          type="monotone"
          dataKey="income"
          name="Income"
          stroke="var(--chart-2)"
          strokeWidth={2.5}
          fill="url(#gIncome)"
          animationDuration={1200}
          animationEasing="ease-out"
        />
        <Area
          type="monotone"
          dataKey="expense"
          name="Expenses"
          stroke="var(--chart-1)"
          strokeWidth={2}
          fill="url(#gExpense)"
          animationDuration={1400}
          animationEasing="ease-out"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function NetBarChart({ data, currency }: { data: DayPoint[]; currency: string }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tick={tick}
          tickLine={false}
          axisLine={false}
          tickFormatter={(d: string) => fmtShort(d)}
          minTickGap={28}
        />
        <YAxis
          tick={tick}
          tickLine={false}
          axisLine={false}
          width={52}
          tickFormatter={(v: number) => formatMoney(v, currency, true)}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          cursor={{ fill: "var(--muted)" }}
          labelFormatter={(l) => fmtLong(String(l))}
          formatter={(v) => [formatMoney(Number(v), currency), "Net profit"]}
        />
        <Bar dataKey="net" radius={[6, 6, 0, 0]} animationDuration={1000} animationEasing="ease-out">
          {data.map((d) => (
            <Cell key={d.date} fill={d.net >= 0 ? "var(--chart-2)" : "var(--chart-5)"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CategoryDonut({ data, currency }: { data: CatTotal[]; currency: string }) {
  const top = data.slice(0, 5);
  const rest = data.slice(5).reduce((s, d) => s + d.total, 0);
  const slices = rest > 0 ? [...top, { category: "Other", total: rest }] : top;
  const total = slices.reduce((s, d) => s + d.total, 0);

  return (
    <div className="flex h-full flex-col gap-4 sm:flex-row sm:items-center">
      <div className="relative mx-auto aspect-square h-full max-h-56 min-h-40 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="total"
              nameKey="category"
              innerRadius="62%"
              outerRadius="92%"
              paddingAngle={3}
              stroke="none"
              animationDuration={1100}
              animationEasing="ease-out"
            >
              {slices.map((s, i) => (
                <Cell key={s.category} fill={SLICES[i % SLICES.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v, name) => [formatMoney(Number(v), currency), String(name)]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <div className="text-[11px] text-muted-foreground">Total</div>
            <div className="text-base font-semibold tabular-nums">
              {formatMoney(total, currency, true)}
            </div>
          </div>
        </div>
      </div>
      <ul className="grid flex-1 gap-2 text-sm">
        {slices.map((s, i) => (
          <li key={s.category} className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ background: SLICES[i % SLICES.length] }}
              />
              <span className="truncate">{s.category}</span>
            </span>
            <span className="tabular-nums text-muted-foreground">
              {total ? Math.round((s.total / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Sparkline({ values, color = "var(--chart-2)" }: { values: number[]; color?: string }) {
  const data = values.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`sp-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={2}
          fill={`url(#sp-${color})`}
          dot={false}
          isAnimationActive
          animationDuration={900}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
