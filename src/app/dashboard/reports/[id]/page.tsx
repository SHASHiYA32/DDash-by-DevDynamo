import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryDonut, NetBarChart, RevenueChart } from "@/components/dashboard/charts";
import { StatCard } from "@/components/dashboard/stat-card";
import { PrintButton } from "@/components/dashboard/print-button";
import { requireManager } from "@/lib/auth";
import { getReport } from "@/lib/db";
import { fmtLong } from "@/lib/analytics";
import { planHas } from "@/lib/plans";
import { formatMoney } from "@/lib/utils";

export const metadata: Metadata = { title: "Report" };

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { business } = await requireManager();
  const report = await getReport(business.id, id);
  if (!report) notFound();

  const a = report.summary;
  const cur = business.currency;
  const canCsv = planHas(business.plan, "csvExport");

  return (
    <div className="grid gap-6">
      <div className="no-print">
        <Button asChild variant="ghost" size="sm" className="-ml-3">
          <Link href="/dashboard/reports">
            <ArrowLeft /> All reports
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge tone="outline" className="capitalize">{report.kind}</Badge>
            {report.auto && <Badge tone="brand">Automatic</Badge>}
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">{business.name}</h1>
          <p className="text-sm text-muted-foreground">
            {fmtLong(report.from)} – {fmtLong(report.to)} · generated {fmtLong(report.createdAt.slice(0, 10))}
          </p>
        </div>
        <div className="no-print flex gap-2">
          {canCsv && (
            <Button asChild variant="outline">
              <a href={`/api/export?from=${report.from}&to=${report.to}`} download>
                <Download /> CSV
              </a>
            </Button>
          )}
          <PrintButton />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Income" value={a.income} kind="money" currency={cur} change={a.change.income} />
        <StatCard label="Expenses" value={a.expense} kind="money" currency={cur} change={a.change.expense} invert delay={0.05} />
        <StatCard label="Net profit" value={a.net} kind="money" currency={cur} change={a.change.net} delay={0.1} />
        <StatCard label="Profit margin" value={a.margin} kind="percent" currency={cur} change={null} delay={0.15} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Income vs expenses</CardTitle>
          <CardDescription>{a.count} transactions in this period</CardDescription>
        </CardHeader>
        <CardContent className="h-72">
          <RevenueChart data={a.daily} currency={cur} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Net profit</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <NetBarChart data={a.buckets} currency={cur} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Expenses by category</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {a.expenseByCategory.length ? (
              <CategoryDonut data={a.expenseByCategory} currency={cur} />
            ) : (
              <p className="text-sm text-muted-foreground">No expenses in this period.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {[
          { title: "Top income sources", rows: a.incomeByCategory },
          { title: "Top expenses", rows: a.expenseByCategory },
        ].map((t) => (
          <Card key={t.title}>
            <CardHeader>
              <CardTitle>{t.title}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2.5">
              {t.rows.length === 0 && <p className="text-sm text-muted-foreground">Nothing recorded.</p>}
              {t.rows.slice(0, 6).map((r) => (
                <div key={r.category} className="flex justify-between text-sm">
                  <span>{r.category}</span>
                  <span className="tabular-nums text-muted-foreground">{formatMoney(r.total, cur)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
