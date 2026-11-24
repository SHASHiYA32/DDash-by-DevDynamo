import type { Metadata } from "next";
import { Reports } from "@/components/dashboard/reports";
import { requireManager } from "@/lib/auth";
import { listReports } from "@/lib/db";
import { planHas } from "@/lib/plans";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage() {
  const { user, business } = await requireManager();
  const reports = await listReports(business.id);

  return (
    <Reports
      reports={reports.map((r) => ({
        id: r.id,
        title: r.title,
        kind: r.kind,
        auto: r.auto,
        createdAt: r.createdAt,
        income: r.summary.income,
        expense: r.summary.expense,
        net: r.summary.net,
      }))}
      currency={business.currency}
      canReports={planHas(business.plan, "reports")}
      canCustom={planHas(business.plan, "customRange")}
      canAutoWeekly={planHas(business.plan, "autoWeekly")}
      canAutoMonthly={planHas(business.plan, "autoMonthly")}
      autoWeekly={business.autoWeekly}
      autoMonthly={business.autoMonthly}
      isOwner={user.role === "owner"}
    />
  );
}
