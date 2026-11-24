import { NextRequest } from "next/server";
import { z } from "zod";
import { fail, getSession, isManager, ok } from "@/lib/auth";
import { addTransaction, deleteTransaction } from "@/lib/db";

const schema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.number().positive("Amount must be greater than zero").max(1_000_000_000),
  category: z.string().trim().min(1, "Choose a category").max(40),
  note: z.string().trim().max(120).default(""),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date"),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return fail("Not signed in", 401);
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const transaction = await addTransaction(session.business.id, session.user.id, parsed.data);
  return ok({ transaction });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return fail("Not signed in", 401);
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return fail("Missing id");
  const removed = await deleteTransaction(
    session.business.id,
    id,
    isManager(session.user.role) ? undefined : session.user.id,
  );
  return removed ? ok() : fail("Transaction not found or not allowed", 404);
}
