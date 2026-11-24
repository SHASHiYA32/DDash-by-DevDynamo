import { NextRequest, NextResponse } from "next/server";
import { expireIfNeeded, listBusinessesWithAutoReports } from "@/lib/db";
import { planHas } from "@/lib/plans";
import { generateReport, lastMonthRange, lastWeekRange } from "@/lib/reports";

/**
 * Runs once a day (see vercel.json). Idempotent: a given week/month is only
 * ever generated once per business, so extra runs are harmless.
 * Protect it with CRON_SECRET in production.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    if (req.headers.get("authorization") !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ ok: false, error: "CRON_SECRET not set" }, { status: 401 });
  }

  const week = lastWeekRange();
  const month = lastMonthRange();
  let created = 0;

  for (const listed of await listBusinessesWithAutoReports()) {
    const b = await expireIfNeeded(listed); // expired plans stop getting automatic reports
    if (b.autoWeekly && planHas(b.plan, "autoWeekly")) {
      if (await generateReport(b.id, "weekly", week.from, week.to, true)) created++;
    }
    if (b.autoMonthly && planHas(b.plan, "autoMonthly")) {
      if (await generateReport(b.id, "monthly", month.from, month.to, true)) created++;
    }
  }
  return NextResponse.json({ ok: true, created });
}
