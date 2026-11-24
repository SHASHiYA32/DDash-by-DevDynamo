import { NextRequest } from "next/server";
import { z } from "zod";
import { fail, gate, getSession, isManager, ok } from "@/lib/auth";
import { deleteReport } from "@/lib/db";
import { daysBetween } from "@/lib/analytics";
import { generateReport, lastMonthRange, lastWeekRange } from "@/lib/reports";

const iso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const schema = z.object({
  kind: z.enum(["weekly", "monthly", "custom"]),
  from: iso.optional(),
  to: iso.optional(),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !isManager(session.user.role)) return fail("Not allowed", 403);
  if (!gate(session, "reports")) {
    return fail("Reports are available on the Growth plan and higher", 403);
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Invalid request");
  const { kind } = parsed.data;

  let range: { from: string; to: string };
  if (kind === "weekly") range = lastWeekRange();
  else if (kind === "monthly") range = lastMonthRange();
  else {
    if (!gate(session, "customRange")) {
      return fail("Custom ranges are available on the Scale plan", 403);
    }
    const { from, to } = parsed.data;
    if (!from || !to) return fail("Choose a start and end date");
    if (to < from) return fail("The end date must be after the start date");
    if (daysBetween(from, to) > 366) return fail("Ranges are limited to one year");
    range = { from, to };
  }

  const report = await generateReport(session.business.id, kind, range.from, range.to);
  return ok({ id: report?.id });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || !isManager(session.user.role)) return fail("Not allowed", 403);
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return fail("Missing id");
  return (await deleteReport(session.business.id, id)) ? ok() : fail("Report not found", 404);
}
