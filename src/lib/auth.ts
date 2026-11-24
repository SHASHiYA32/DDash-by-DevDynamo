import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import { expireIfNeeded, getBusinessById, getUserById, type Business, type Role, type User } from "./db";
import { planHas, type FeatureKey } from "./plans";

const COOKIE = "ddash_session";
const secret = new TextEncoder().encode(
  process.env.DDASH_SECRET ?? "dev-only-secret-change-me-before-production!!",
);

export type SessionUser = Omit<User, "passwordHash">;
export interface Session {
  user: SessionUser;
  business: Business;
  /** true when the user's email is listed in DEV_EMAILS (access to /dev). */
  isDev: boolean;
}

export function isDevEmail(email: string) {
  return (process.env.DEV_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase());
}

export async function createSession(userId: string) {
  const token = await new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

/** Cached per request, so layouts and pages can all call it for free. */
export const getSession = cache(async (): Promise<Session | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    const user = await getUserById(String(payload.uid));
    if (!user || !user.active) return null;
    const found = await getBusinessById(user.businessId);
    if (!found) return null;
    const business = await expireIfNeeded(found);
    if (user.role === "employee" && !business.employeePortal) return null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...safe } = user;
    return { user: safe, business, isDev: isDevEmail(user.email) };
  } catch (e) {
    // Bad / expired token → signed out. Anything else (database down) must not look like a logout.
    if ((e as { code?: string })?.code?.startsWith("ERR_J")) return null;
    throw e;
  }
});

export async function requireSession(): Promise<Session> {
  const s = await getSession();
  if (!s) redirect("/login");
  return s;
}

export const isManager = (role: Role) => role === "owner" || role === "admin";

/** Server pages: managers only, others are sent back to the overview. */
export async function requireManager(): Promise<Session> {
  const s = await requireSession();
  if (!isManager(s.user.role)) redirect("/dashboard");
  return s;
}

/** Developer console pages: only emails listed in DEV_EMAILS. */
export async function requireDev(): Promise<Session> {
  const s = await requireSession();
  if (!s.isDev) redirect("/dashboard");
  return s;
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export function ok(data: Record<string, unknown> = {}) {
  return NextResponse.json({ ok: true, ...data });
}

export function gate(session: Session, feature: FeatureKey) {
  return planHas(session.business.plan, feature);
}
