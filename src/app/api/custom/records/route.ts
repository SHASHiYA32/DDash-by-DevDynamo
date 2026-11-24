import { NextRequest } from "next/server";
import { fail, gate, getSession, isManager, ok, type Session } from "@/lib/auth";
import { deleteRecord, getTabById, insertRecord, updateRecord } from "@/lib/db";
import { validateRecord, type DataConfig } from "@/lib/custom";

async function tabFor(session: Session, tabId: unknown) {
  if (typeof tabId !== "string") return null;
  const tab = await getTabById(tabId);
  if (!tab || tab.businessId !== session.business.id || !tab.enabled || tab.kind !== "data") return null;
  if (!gate(session, "customTabs")) return null;
  if (tab.access === "managers" && !isManager(session.user.role)) return null;
  return tab;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return fail("Not signed in", 401);
  const body = await req.json().catch(() => null);
  const tab = await tabFor(session, body?.tabId);
  if (!tab) return fail("Tab not found", 404);
  const v = validateRecord((tab.config as DataConfig).fields, body?.data);
  if (!v.ok) return fail(v.error);
  return ok({ record: await insertRecord(tab.id, session.business.id, session.user.id, v.value) });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return fail("Not signed in", 401);
  const body = await req.json().catch(() => null);
  const tab = await tabFor(session, body?.tabId);
  if (!tab) return fail("Tab not found", 404);
  const v = validateRecord((tab.config as DataConfig).fields, body?.data);
  if (!v.ok) return fail(v.error);
  const done = await updateRecord(String(body?.id), tab.id, session.business.id, v.value);
  return done ? ok() : fail("Record not found", 404);
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return fail("Not signed in", 401);
  const tab = await tabFor(session, req.nextUrl.searchParams.get("tabId"));
  if (!tab) return fail("Tab not found", 404);
  const done = await deleteRecord(String(req.nextUrl.searchParams.get("id")), tab.id, session.business.id);
  return done ? ok() : fail("Record not found", 404);
}
