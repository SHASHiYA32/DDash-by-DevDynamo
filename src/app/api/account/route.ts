import { NextRequest } from "next/server";
import { z } from "zod";
import { ACCENT_IDS } from "@/lib/accent";
import { fail, getSession, ok } from "@/lib/auth";
import { setUserAccent } from "@/lib/db";

const schema = z.object({ accent: z.string().refine((a) => ACCENT_IDS.includes(a), "Unknown colour") });

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return fail("Not signed in", 401);
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Unknown colour");
  await setUserAccent(session.user.id, parsed.data.accent);
  return ok();
}
