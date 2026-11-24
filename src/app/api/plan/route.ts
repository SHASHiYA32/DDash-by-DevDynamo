import { NextRequest } from "next/server";
import { z } from "zod";
import { fail, getSession, ok } from "@/lib/auth";
import { changePlan } from "@/lib/db";
import { PLANS } from "@/lib/plans";

const schema = z.object({
  plan: z.enum(["starter", "growth", "scale"]),
  billing: z.enum(["monthly", "yearly"]).default("monthly"),
});

/**
 * Buy / renew / upgrade / downgrade / cancel (plan = "starter").
 * ⚠ No payment is taken here yet. When you connect Stripe (or similar), call
 * changePlan() from the verified payment webhook instead of from this route.
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.user.role !== "owner") return fail("Only the owner can change the plan", 403);
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Invalid request");
  const { plan, billing } = parsed.data;

  const result = await changePlan(session.business.id, plan, billing);
  if ("error" in result) return fail(result.error, 403);
  return ok({ plan, planName: PLANS[plan].name, renewsAt: result.renewsAt });
}
