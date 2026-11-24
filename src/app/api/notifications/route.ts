import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { fail, getSession, ok } from "@/lib/auth";
import { listNotificationsFor, markNotificationsRead } from "@/lib/db";

export async function GET() {
  const s = await getSession();
  if (!s) return fail("Not signed in", 401);
  const items = await listNotificationsFor(s.user.id, s.business.id);
  return NextResponse.json({ ok: true, items, unread: items.filter((i) => !i.read).length });
}

const schema = z.object({ ids: z.array(z.string()).max(50).optional(), all: z.boolean().optional() });

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return fail("Not signed in", 401);
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Invalid request");
  await markNotificationsRead(s.user.id, s.business.id, parsed.data.all ? "all" : (parsed.data.ids ?? []));
  return ok();
}
