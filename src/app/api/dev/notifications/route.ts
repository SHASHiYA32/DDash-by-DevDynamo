import { NextRequest } from "next/server";
import { z } from "zod";
import { fail, getSession, ok } from "@/lib/auth";
import { createNotification, deleteNotification } from "@/lib/db";

const safeUrl = z
  .string()
  .trim()
  .max(500)
  .refine((u) => (u.startsWith("/") && !u.startsWith("//")) || /^https:\/\/[^\s]+$/.test(u), "Use a /dashboard/... path or an https:// link");

const schema = z.object({
  businessId: z.string().uuid().nullable(),
  title: z.string().trim().min(2).max(80),
  body: z.string().trim().max(300).default(""),
  action: z.object({ label: z.string().trim().min(1).max(30), url: safeUrl }).nullable().default(null),
  expiresInDays: z.number().int().min(1).max(365).nullable().default(null),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.isDev) return fail("Not allowed", 403);
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid notification");
  const d = parsed.data;
  const id = await createNotification(session.user.id, {
    businessId: d.businessId,
    title: d.title,
    body: d.body,
    actionLabel: d.action?.label ?? null,
    actionUrl: d.action?.url ?? null,
    expiresInDays: d.expiresInDays,
  });
  return id ? ok({ id }) : fail("Business not found", 404);
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session?.isDev) return fail("Not allowed", 403);
  const id = req.nextUrl.searchParams.get("id") ?? "";
  return (await deleteNotification(id)) ? ok() : fail("Not found", 404);
}
