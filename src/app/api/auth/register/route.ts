import { NextRequest } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { createSession, fail, ok } from "@/lib/auth";
import { createBusinessWithOwner } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { demoTransactions } from "@/lib/seed";

const schema = z.object({
  businessName: z.string().trim().min(2, "Business name is too short").max(60),
  ownerName: z.string().trim().min(2, "Enter your name").max(60),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
  industry: z.string().max(40).default("Other"),
  currency: z.string().length(3).default("USD"),
  plan: z.enum(["starter", "growth", "scale"]).default("starter"),
  billing: z.enum(["monthly", "yearly"]).default("monthly"),
  demoData: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const d = parsed.data;

  const result = await createBusinessWithOwner({
    name: d.businessName,
    slug: slugify(d.businessName),
    industry: d.industry,
    currency: d.currency.toUpperCase(),
    plan: d.plan,
    billing: d.billing,
    ownerName: d.ownerName,
    email: d.email,
    passwordHash: await bcrypt.hash(d.password, 10),
    demo: d.demoData ? demoTransactions(d.businessName) : [],
  });

  if ("error" in result) return fail(result.error, 409);
  await createSession(result.userId);
  return ok();
}
