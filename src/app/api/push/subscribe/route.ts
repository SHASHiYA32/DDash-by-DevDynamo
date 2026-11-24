import { NextRequest } from "next/server";
import { z } from "zod";
import { fail, getSession, ok } from "@/lib/auth";
import { deletePushSubscriptions, savePushSubscription } from "@/lib/db";

const schema = z.object({
  endpoint: z.string().url().max(1000).startsWith("https://"),
  keys: z.object({ p256dh: z.string().min(10).max(200), auth: z.string().min(10).max(100) }),
});

/** Remember this device for the signed-in user. */
export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return fail("Not signed in", 401);
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Invalid subscription");
  const { endpoint, keys } = parsed.data;
  await savePushSubscription(s.user.id, s.business.id, { endpoint, p256dh: keys.p256dh, auth: keys.auth }, req.headers.get("user-agent"));
  return ok();
}

/** Forget this device (turning alerts off, or signing out). */
export async function DELETE(req: NextRequest) {
  const s = await getSession();
  if (!s) return ok();
  const endpoint = req.nextUrl.searchParams.get("endpoint");
  if (endpoint) await deletePushSubscriptions([endpoint]);
  return ok();
}
