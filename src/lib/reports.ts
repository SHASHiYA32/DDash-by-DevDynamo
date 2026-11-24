import "server-only";
import { randomUUID } from "crypto";
import {
  addDays,
  analyze,
  daysBetween,
  fmtLong,
  fmtShort,
  lastMonthRange,
  lastWeekRange,
} from "./analytics";
import { insertReport, listTransactions, type Report } from "./db";

export function periodTitle(kind: Report["kind"], from: string, to: string) {
  const label =
    kind === "weekly" ? "Weekly report" : kind === "monthly" ? "Monthly report" : "Custom report";
  return `${label} · ${fmtShort(from)} – ${fmtLong(to)}`;
}

/**
 * Builds and stores a report. Automatic reports use a fixed key
 * (kind:from:to) so running the cron twice never creates duplicates.
 */
export async function generateReport(
  businessId: string,
  kind: Report["kind"],
  from: string,
  to: string,
  auto = false,
): Promise<Report | null> {
  const length = daysBetween(from, to) + 1;
  // also load the previous period so "vs previous period" can be calculated
  const txs = await listTransactions(businessId, { from: addDays(from, -length), to });
  return insertReport({
    businessId,
    kind,
    title: periodTitle(kind, from, to),
    from,
    to,
    auto,
    key: auto ? `${kind}:${from}:${to}` : `${kind}:${from}:${to}:${randomUUID().slice(0, 8)}`,
    summary: analyze(txs, from, to),
  });
}

export { lastMonthRange, lastWeekRange };
