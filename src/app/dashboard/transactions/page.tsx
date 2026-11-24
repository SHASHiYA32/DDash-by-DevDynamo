import type { Metadata } from "next";
import { Transactions } from "@/components/dashboard/transactions";
import { isManager, requireSession } from "@/lib/auth";
import { listTransactions } from "@/lib/db";
import { planHas } from "@/lib/plans";

export const metadata: Metadata = { title: "Transactions" };

export default async function TransactionsPage() {
  const { user, business } = await requireSession();
  const txs = await listTransactions(business.id, { limit: 3000 });

  return (
    <Transactions
      txs={txs.map((t) => ({ ...t, createdBy: t.createdBy ?? "" }))}
      currency={business.currency}
      userId={user.id}
      isManager={isManager(user.role)}
      canExport={planHas(business.plan, "csvExport")}
    />
  );
}
