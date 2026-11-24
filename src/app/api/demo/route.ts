import { fail, getSession, isManager, ok } from "@/lib/auth";
import { loadDemoData } from "@/lib/db";
import { demoTransactions } from "@/lib/seed";

export async function POST() {
  const session = await getSession();
  if (!session || !isManager(session.user.role)) return fail("Not allowed", 403);
  const rows = demoTransactions(session.business.name);
  const added = await loadDemoData(session.business.id, session.user.id, rows);
  return added ? ok({ added: rows.length }) : fail("You already have transactions");
}
