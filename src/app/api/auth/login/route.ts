import { NextRequest } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { createSession, fail, ok } from "@/lib/auth";
import { getBusinessById, getUserByEmail } from "@/lib/db";

const schema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
  businessSlug: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const { email, password, businessSlug } = parsed.data;

  const user = await getUserByEmail(email);
  const business = user ? await getBusinessById(user.businessId) : null;

  const invalid = "Invalid email or password";
  if (!user || !business) return fail(invalid, 401);
  if (!(await bcrypt.compare(password, user.passwordHash))) return fail(invalid, 401);
  if (!user.active) {
    return fail("This account has been deactivated. Contact your business owner.", 403);
  }
  if (businessSlug && business.slug !== businessSlug) return fail(invalid, 401);
  if (user.role === "employee" && !business.employeePortal) {
    return fail("Employee login is currently turned off by your business owner.", 403);
  }

  await createSession(user.id);
  return ok();
}
