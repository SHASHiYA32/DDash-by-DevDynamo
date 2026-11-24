import { NextRequest, NextResponse } from "next/server";
import { fail, gate, getSession, isManager } from "@/lib/auth";
import { listTransactions } from "@/lib/db";

const esc = (v: string | number) => {
  const s = String(v);
  // Neutralise spreadsheet formula injection and quote special characters.
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !isManager(session.user.role)) return fail("Not allowed", 403);
  if (!gate(session, "csvExport")) {
    return fail("CSV export is available on the Growth plan and higher", 403);
  }
  const f = req.nextUrl.searchParams.get("from");
  const t = req.nextUrl.searchParams.get("to");
  const from = f && ISO.test(f) ? f : undefined;
  const to = t && ISO.test(t) ? t : undefined;

  const rows = (await listTransactions(session.business.id, { from, to })).reverse();
  const csv = [
    "date,type,category,amount,note",
    ...rows.map((r) => [r.date, r.type, esc(r.category), r.amount.toFixed(2), esc(r.note)].join(",")),
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ddash-transactions-${from ?? "all"}-to-${to ?? "now"}.csv"`,
    },
  });
}
