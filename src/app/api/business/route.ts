import { NextRequest } from "next/server";
import { z } from "zod";
import { destroySession, fail, getSession, isManager, ok } from "@/lib/auth";
import { deleteBusiness, updateBusiness } from "@/lib/db";
import { planHas } from "@/lib/plans";

const patchSchema = z.object({
  name: z.string().trim().min(2, "Business name is too short").max(60).optional(),
  industry: z.string().max(40).optional(),
  currency: z.string().length(3).optional(),
  employeePortal: z.boolean().optional(),
  autoWeekly: z.boolean().optional(),
  autoMonthly: z.boolean().optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || !isManager(session.user.role)) return fail("Not allowed", 403);
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const d = parsed.data;
  const plan = session.business.plan;

  if (d.autoWeekly && !planHas(plan, "autoWeekly")) {
    return fail("Automatic weekly reports need the Growth plan or higher", 403);
  }
  if (d.autoMonthly && !planHas(plan, "autoMonthly")) {
    return fail("Automatic monthly reports need the Scale plan", 403);
  }
  await updateBusiness(session.business.id, {
    ...d,
    currency: d.currency?.toUpperCase(),
  });
  return ok();
}

const deleteSchema = z.object({ confirm: z.string() });

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || session.user.role !== "owner") {
    return fail("Only the owner can delete the business", 403);
  }
  const parsed = deleteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success || parsed.data.confirm !== session.business.name) {
    return fail("Type the business name exactly to confirm");
  }
  await deleteBusiness(session.business.id);
  await destroySession();
  return ok();
}
