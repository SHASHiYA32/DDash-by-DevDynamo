import { NextRequest } from "next/server";
import { z } from "zod";
import { fail, gate, getSession, isManager, ok } from "@/lib/auth";
import { createRequest } from "@/lib/db";

const schema = z.object({
  title: z.string().trim().min(3, "Give your idea a short title").max(80),
  description: z.string().trim().min(10, "Describe what you need in a sentence or two").max(2000),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !isManager(session.user.role)) return fail("Not allowed", 403);
  if (!gate(session, "customTabs")) return fail("Custom upgrades need the Growth plan or higher", 403);
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  const r = await createRequest(session.business.id, session.user.id, session.business.plan, parsed.data);
  return ok(r);
}
