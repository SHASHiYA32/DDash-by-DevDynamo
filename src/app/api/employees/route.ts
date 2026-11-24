import { NextRequest } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { fail, getSession, isManager, ok } from "@/lib/auth";
import { addMember, deleteMember, getMember, updateMember } from "@/lib/db";

const createSchema = z.object({
  name: z.string().trim().min(2, "Enter the employee's name").max(60),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
  role: z.enum(["admin", "employee"]).default("employee"),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !isManager(session.user.role)) return fail("Not allowed", 403);
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const d = parsed.data;
  if (d.role === "admin" && session.user.role !== "owner") {
    return fail("Only the owner can create admins", 403);
  }
  const result = await addMember(session.business.id, session.business.plan, {
    name: d.name,
    email: d.email,
    role: d.role,
    passwordHash: await bcrypt.hash(d.password, 10),
  });
  return "error" in result ? fail(result.error, 403) : ok();
}

const patchSchema = z.object({
  id: z.string(),
  role: z.enum(["admin", "employee"]).optional(),
  active: z.boolean().optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || !isManager(session.user.role)) return fail("Not allowed", 403);
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Invalid request");
  const { id, role, active } = parsed.data;
  if (role && session.user.role !== "owner") return fail("Only the owner can change roles", 403);

  const target = await getMember(session.business.id, id);
  if (!target) return fail("Member not found", 403);
  if (target.role === "owner") return fail("The owner account can't be changed", 403);
  if (target.id === session.user.id) return fail("You can't change your own access", 403);
  if (target.role === "admin" && session.user.role !== "owner") {
    return fail("Only the owner can change an admin", 403);
  }
  await updateMember(session.business.id, id, { role, active });
  return ok();
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || !isManager(session.user.role)) return fail("Not allowed", 403);
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return fail("Missing id");

  const target = await getMember(session.business.id, id);
  if (!target) return fail("Member not found", 403);
  if (target.role === "owner") return fail("The owner can't be removed", 403);
  if (target.id === session.user.id) return fail("You can't remove yourself", 403);
  if (target.role === "admin" && session.user.role !== "owner") {
    return fail("Only the owner can remove an admin", 403);
  }
  await deleteMember(session.business.id, id);
  return ok();
}
