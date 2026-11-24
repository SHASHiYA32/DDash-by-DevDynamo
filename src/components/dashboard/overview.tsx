"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SegmentedControl } from "glisse";
import { Plus, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryDonut, NetBarChart, RevenueChart } from "@/components/dashboard/charts";
import { StatCard } from "@/components/dashboard/stat-card";
import { UpgradeCard } from "@/components/dashboard/upgrade-card";
import { analyze, addDays, fmtShort, todayIso, type Tx } from "@/lib/analytics";
import { api, withToast } from "@/lib/client";
import { formatMoney } from "@/lib/utils";

interface Props {
  txs: Tx[];
  /** true when the business has no transactions at all (not just none in range) */
  empty: boolean;
  currency: string;
  businessName: string;
  firstName: string;
  advancedCharts: boolean;
  isOwner: boolean;
  canManage: boolean;
}

const RANGES = [
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
];

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export function Overview({ txs, empty, currency, businessName, firstName, advancedCharts, isOwner, canManage }: Props) {
  const router = useRouter();
  const [range, setRange] = useState("30");
  const [loadingDemo, setLoadingDemo] = useState(false);

  const a = useMemo(() => {
    const to = todayIso();
    return analyze(txs, addDays(to, -(Number(range) - 1)), to);
  }, [txs, range]);

  const recent = useMemo(
    () => [...txs].sort((x, y) => y.date.localeCompare(x.date)).slice(0, 6),
    [txs],
  );

  async function loadDemo() {
    setLoadingDemo(true);
    const r = await withToast(() => api("/api/demo"), {
      loading: "Loading demo data…",
      success: "Demo data added",
      error: "Couldn't add demo data",
    });
    setLoadingDemo(false);
    if (r.ok) router.refresh();
  }

  if (empty) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Card className="max-w-md p-8 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-brand text-brand-foreground">
            <Sparkles className="size-5" />
          </span>
          <h1 className="mt-4 text-xl font-semibold tracking-tight">Welcome, {firstName}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {businessName} has no numbers yet. Add your first transaction, or load sample data to
            explore the charts.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button asChild>
              <Link href="/dashboard/transactions">
                <Plus /> Add transaction
              </Link>
            </Button>
            {canManage && (
              <Button variant="outline" onClick={loadDemo} disabled={loadingDemo}>
                Load sample data
              </Button>
            )}
          </div>
        </Card>
      </div>
    );
  }

  const spark = (key: "income" | "expense" | "net") => a.buckets.map((b) => Math.max(0, b[key]));

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{greeting()}, {firstName}</p>
          <h1 className="text-2xl font-semibold tracking-tight">{businessName}</h1>
        </div>
        <div className="flex items-center gap-3">
          <SegmentedControl aria-label="Date range" items={RANGES} value={range} onValueChange={setRange} />
          <Button asChild className="hidden sm:inline-flex">
            <Link href="/dashboard/transactions">
              <Plus /> Add
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Income" value={a.income} kind="money" currency={currency} change={a.change.income} spark={spark("income")} delay={0} />
        <StatCard label="Expenses" value={a.expense} kind="money" currency={currency} change={a.change.expense} invert spark={spark("expense")} sparkColor="var(--chart-1)" delay={0.06} />
        <StatCard label="Net profit" value={a.net} kind="money" currency={currency} change={a.change.net} spark={spark("net")} sparkColor="var(--chart-3)" delay={0.12} />
        <StatCard label="Profit margin" value={a.margin} kind="percent" currency={currency} change={null} delay={0.18} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Income vs expenses</CardTitle>
            <CardDescription>
              {fmtShort(a.from)} – {fmtShort(a.to)}
            </CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <RevenueChart data={a.daily} currency={currency} />
          </CardContent>
        </Card>

        {advancedCharts ? (
          <Card>
            <CardHeader>
              <CardTitle>Where the money goes</CardTitle>
              <CardDescription>Expenses by category</CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              {a.expenseByCategory.length ? (
                <CategoryDonut data={a.expenseByCategory} currency={currency} />
              ) : (
                <p className="text-sm text-muted-foreground">No expenses in this period.</p>
              )}
            </CardContent>
          </Card>
        ) : (
          <UpgradeCard feature="advancedCharts" canUpgrade={isOwner} />
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {advancedCharts ? (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Net profit</CardTitle>
              <CardDescription>{a.buckets.length > 14 && Number(range) > 45 ? "Per week" : "Per day"}</CardDescription>
            </CardHeader>
            <CardContent className="h-64">
              <NetBarChart data={a.buckets} currency={currency} />
            </CardContent>
          </Card>
        ) : (
          <UpgradeCard feature="advancedCharts" canUpgrade={isOwner} className="lg:col-span-2" />
        )}

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {recent.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i }}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{t.note || t.category}</div>
                  <div className="text-xs text-muted-foreground">
                    {t.category} · {fmtShort(t.date)}
                  </div>
                </div>
                <span
                  className={
                    t.type === "income"
                      ? "font-medium tabular-nums text-emerald-600 dark:text-emerald-400"
                      : "font-medium tabular-nums"
                  }
                >
                  {t.type === "income" ? "+" : "−"}
                  {formatMoney(t.amount, currency)}
                </span>
              </motion.div>
            ))}
            <Button asChild variant="ghost" size="sm" className="mt-1 justify-self-start">
              <Link href="/dashboard/transactions">View all</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
