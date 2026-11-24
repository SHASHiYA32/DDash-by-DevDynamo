import { Overview } from "@/components/dashboard/overview";
import { addDays, todayIso } from "@/lib/analytics";
import { isManager, requireSession } from "@/lib/auth";
import { hasTransactions, listTransactions } from "@/lib/db";
import { planHas } from "@/lib/plans";

export default async function OverviewPage() {
  const { user, business } = await requireSession();
  // the overview needs at most 90 days + the 90 before them for "vs previous period"
  const txs = await listTransactions(business.id, { from: addDays(todayIso(), -185) });
  const empty = txs.length === 0 && !(await hasTransactions(business.id));

  return (
    <Overview
      txs={txs.map((t) => ({ id: t.id, type: t.type, amount: t.amount, category: t.category, note: t.note, date: t.date }))}
      empty={empty}
      currency={business.currency}
      businessName={business.name}
      firstName={user.name.split(" ")[0]}
      advancedCharts={planHas(business.plan, "advancedCharts")}
      isOwner={user.role === "owner"}
      canManage={isManager(user.role)}
    />
  );
}
