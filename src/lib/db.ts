import "server-only";
import { randomUUID } from "crypto";
import type { Analysis } from "./analytics";
import type { TabConfig, TabKind } from "./custom";
import type { DemoRow } from "./seed";
import { memberLimit, PLANS, planHas, type PlanId } from "./plans";
import { isUnique, isUuid, query, tx, type Q, type Row } from "./sql";

/* ------------------------------------------------------------------ types */

export type Role = "owner" | "admin" | "employee";
export type Billing = "monthly" | "yearly";
export type RequestStatus = "pending" | "in_progress" | "delivered" | "declined";

export interface Business {
  id: string;
  name: string;
  slug: string;
  industry: string;
  currency: string;
  plan: PlanId;
  planBilling: Billing;
  planRenewsAt: string | null;
  employeePortal: boolean;
  autoWeekly: boolean;
  autoMonthly: boolean;
  createdAt: string;
}

export interface User {
  id: string;
  businessId: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  active: boolean;
  accent: string;
  createdAt: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  createdAt: string;
}

export interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  note: string;
  date: string;
  createdBy: string | null;
}

export interface Report {
  id: string;
  businessId: string;
  kind: "weekly" | "monthly" | "custom";
  title: string;
  from: string;
  to: string;
  auto: boolean;
  createdAt: string;
  summary: Analysis;
}

export interface CustomRequest {
  id: string;
  businessId: string;
  businessName?: string;
  requesterName?: string | null;
  title: string;
  description: string;
  status: RequestStatus;
  extra: boolean;
  devNote: string;
  createdAt: string;
}

export interface CustomTab {
  id: string;
  businessId: string;
  businessName?: string;
  requestId: string | null;
  title: string;
  slug: string;
  icon: string;
  kind: TabKind;
  access: "all" | "managers";
  config: TabConfig;
  enabled: boolean;
  createdAt: string;
}

export interface CustomRecord {
  id: string;
  data: Record<string, string | number | boolean>;
  createdAt: string;
}

/* ---------------------------------------------------------------- helpers */

const iso = (v: unknown) => (v instanceof Date ? v.toISOString() : String(v));
const parse = <T>(v: unknown): T => (typeof v === "string" ? JSON.parse(v) : v) as T;
const DAY = 86_400_000;

const toBusiness = (r: Row): Business => ({
  id: r.id,
  name: r.name,
  slug: r.slug,
  industry: r.industry,
  currency: String(r.currency).trim(),
  plan: r.plan,
  planBilling: r.plan_billing,
  planRenewsAt: r.plan_renews_at ? iso(r.plan_renews_at) : null,
  employeePortal: r.employee_portal,
  autoWeekly: r.auto_weekly,
  autoMonthly: r.auto_monthly,
  createdAt: iso(r.created_at),
});

const toUser = (r: Row): User => ({
  id: r.id,
  businessId: r.business_id,
  name: r.name,
  email: r.email,
  passwordHash: r.password_hash,
  role: r.role,
  active: r.active,
  accent: r.accent,
  createdAt: iso(r.created_at),
});

const toMember = (r: Row): Member => ({
  id: r.id,
  name: r.name,
  email: r.email,
  role: r.role,
  active: r.active,
  createdAt: iso(r.created_at),
});

const toTx = (r: Row): Transaction => ({
  id: r.id,
  type: r.type,
  amount: Number(r.amount),
  category: r.category,
  note: r.note,
  date: r.date,
  createdBy: r.created_by,
});

const toReport = (r: Row): Report => ({
  id: r.id,
  businessId: r.business_id,
  kind: r.kind,
  title: r.title,
  from: r.from_date,
  to: r.to_date,
  auto: r.auto,
  createdAt: iso(r.created_at),
  summary: parse<Analysis>(r.summary),
});

const toRequest = (r: Row): CustomRequest => ({
  id: r.id,
  businessId: r.business_id,
  businessName: r.business_name ?? undefined,
  requesterName: r.requester_name ?? null,
  title: r.title,
  description: r.description,
  status: r.status,
  extra: r.extra,
  devNote: r.dev_note,
  createdAt: iso(r.created_at),
});

const toTab = (r: Row): CustomTab => ({
  id: r.id,
  businessId: r.business_id,
  businessName: r.business_name ?? undefined,
  requestId: r.request_id,
  title: r.title,
  slug: r.slug,
  icon: r.icon,
  kind: r.kind,
  access: r.access,
  config: parse<TabConfig>(r.config),
  enabled: r.enabled,
  createdAt: iso(r.created_at),
});

const toRecord = (r: Row): CustomRecord => ({
  id: r.id,
  data: parse(r.data),
  createdAt: iso(r.created_at),
});

const TX_COLS = "id, type, amount, category, note, date::text as date, created_by";
const REPORT_COLS = "id, business_id, kind, title, from_date::text as from_date, to_date::text as to_date, auto, summary, created_at";

/** A paid plan whose renewal date has passed counts as Starter again. */
export async function expireIfNeeded(b: Business): Promise<Business> {
  if (b.plan === "starter" || !b.planRenewsAt || new Date(b.planRenewsAt).getTime() > Date.now()) return b;
  await query(
    `update businesses set plan='starter', plan_billing='monthly', plan_renews_at=null,
            auto_weekly=false, auto_monthly=false where id=$1 and plan<>'starter'`,
    [b.id],
  );
  return { ...b, plan: "starter", planBilling: "monthly", planRenewsAt: null, autoWeekly: false, autoMonthly: false };
}

/* ------------------------------------------------------ businesses & users */

export async function getBusinessById(id: string): Promise<Business | null> {
  if (!isUuid(id)) return null;
  const rows = await query("select * from businesses where id=$1", [id]);
  return rows[0] ? toBusiness(rows[0]) : null;
}

export async function getBusinessBySlug(slug: string): Promise<Business | null> {
  const rows = await query("select * from businesses where slug=$1", [slug]);
  return rows[0] ? toBusiness(rows[0]) : null;
}

export async function getUserById(id: string): Promise<User | null> {
  if (!isUuid(id)) return null;
  const rows = await query("select * from users where id=$1", [id]);
  return rows[0] ? toUser(rows[0]) : null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const rows = await query("select * from users where lower(email)=lower($1)", [email]);
  return rows[0] ? toUser(rows[0]) : null;
}

export async function setUserAccent(userId: string, accent: string) {
  await query("update users set accent=$2 where id=$1", [userId, accent]);
}

async function insertTransactions(q: Q, businessId: string, userId: string, rows: DemoRow[]) {
  if (rows.length === 0) return;
  await q(
    `insert into transactions (business_id, type, amount, category, note, date, created_by)
     select $1::uuid, t.type, t.amount, t.category, t.note, t.date, $2::uuid
     from unnest($3::text[], $4::numeric[], $5::text[], $6::text[], $7::date[]) as t(type, amount, category, note, date)`,
    [
      businessId,
      userId,
      rows.map((r) => r.type),
      rows.map((r) => r.amount),
      rows.map((r) => r.category),
      rows.map((r) => r.note),
      rows.map((r) => r.date),
    ],
  );
}

function periodEnd(billing: Billing, from = Date.now()) {
  return new Date(from + (billing === "yearly" ? 365 : 30) * DAY).toISOString();
}

export async function createBusinessWithOwner(d: {
  name: string;
  slug: string;
  industry: string;
  currency: string;
  plan: PlanId;
  billing: Billing;
  ownerName: string;
  email: string;
  passwordHash: string;
  demo: DemoRow[];
}): Promise<{ userId: string } | { error: string }> {
  try {
    return await tx(async (q) => {
      if ((await q("select 1 from users where lower(email)=lower($1)", [d.email])).length) {
        return { error: "An account with this email already exists" };
      }
      let slug = d.slug;
      let businessId: string | undefined;
      for (let i = 0; i < 6 && !businessId; i++) {
        const rows = await q(
          `insert into businesses (name, slug, industry, currency, plan, plan_billing, plan_renews_at)
           values ($1,$2,$3,$4,$5,$6,$7) on conflict (slug) do nothing returning id`,
          [d.name, slug, d.industry, d.currency, d.plan, d.billing, d.plan === "starter" ? null : periodEnd(d.billing)],
        );
        if (rows[0]) businessId = rows[0].id;
        else slug = `${d.slug.slice(0, 27)}-${randomUUID().slice(0, 4)}`;
      }
      if (!businessId) return { error: "Couldn't create the business, please try again" };
      const [u] = await q(
        `insert into users (business_id, name, email, password_hash, role)
         values ($1,$2,lower($3),$4,'owner') returning id`,
        [businessId, d.ownerName, d.email, d.passwordHash],
      );
      await insertTransactions(q, businessId, u.id, d.demo);
      return { userId: u.id as string };
    });
  } catch (e) {
    if (isUnique(e)) return { error: "An account with this email already exists" };
    throw e;
  }
}

export async function updateBusiness(
  id: string,
  patch: Partial<Pick<Business, "name" | "industry" | "currency" | "employeePortal" | "autoWeekly" | "autoMonthly">>,
) {
  const map = {
    name: "name",
    industry: "industry",
    currency: "currency",
    employeePortal: "employee_portal",
    autoWeekly: "auto_weekly",
    autoMonthly: "auto_monthly",
  } as const;
  const sets: string[] = [];
  const params: unknown[] = [id];
  for (const [k, col] of Object.entries(map)) {
    const v = patch[k as keyof typeof map];
    if (v !== undefined) {
      params.push(v);
      sets.push(`${col}=$${params.length}`);
    }
  }
  if (sets.length) await query(`update businesses set ${sets.join(", ")} where id=$1`, params);
}

export async function deleteBusiness(id: string) {
  await query("delete from businesses where id=$1", [id]);
}

/** Changes, upgrades, renews or cancels (plan = starter) a subscription. */
export async function changePlan(
  businessId: string,
  plan: PlanId,
  billing: Billing,
): Promise<{ error: string } | { renewsAt: string | null }> {
  return tx(async (q) => {
    const rows = await q("select * from businesses where id=$1 for update", [businessId]);
    if (!rows[0]) return { error: "Business not found" };
    const cur = toBusiness(rows[0]);
    const [{ n }] = await q("select count(*)::int as n from users where business_id=$1", [businessId]);
    if (n > memberLimit(plan)) {
      return {
        error: `You have ${n} team members, but ${PLANS[plan].name} allows ${memberLimit(plan)}. Remove some first.`,
      };
    }
    // Renewing the same plan extends from the current end date, otherwise a fresh period starts now.
    const stillRunning = cur.planRenewsAt && new Date(cur.planRenewsAt).getTime() > Date.now();
    const base = cur.plan === plan && stillRunning ? new Date(cur.planRenewsAt!).getTime() : Date.now();
    const renewsAt = plan === "starter" ? null : periodEnd(billing, base);
    await q(
      `update businesses set plan=$2, plan_billing=$3, plan_renews_at=$4,
              auto_weekly = auto_weekly and $5, auto_monthly = auto_monthly and $6 where id=$1`,
      [businessId, plan, plan === "starter" ? "monthly" : billing, renewsAt, planHas(plan, "autoWeekly"), planHas(plan, "autoMonthly")],
    );
    return { renewsAt };
  });
}

/* ---------------------------------------------------------------- members */

export async function listMembers(businessId: string): Promise<Member[]> {
  const rows = await query(
    "select id, name, email, role, active, created_at from users where business_id=$1 order by created_at",
    [businessId],
  );
  return rows.map(toMember);
}

export async function countMembers(businessId: string): Promise<number> {
  const [{ n }] = await query("select count(*)::int as n from users where business_id=$1", [businessId]);
  return n;
}

export async function getMember(businessId: string, id: string): Promise<Member | null> {
  if (!isUuid(id)) return null;
  const rows = await query(
    "select id, name, email, role, active, created_at from users where business_id=$1 and id=$2",
    [businessId, id],
  );
  return rows[0] ? toMember(rows[0]) : null;
}

export async function addMember(
  businessId: string,
  plan: PlanId,
  d: { name: string; email: string; passwordHash: string; role: "admin" | "employee" },
): Promise<{ error: string } | { ok: true }> {
  try {
    return await tx(async (q) => {
      await q("select id from businesses where id=$1 for update", [businessId]);
      const [{ n }] = await q("select count(*)::int as n from users where business_id=$1", [businessId]);
      const limit = memberLimit(plan);
      if (n >= limit) {
        return { error: `Your ${PLANS[plan].name} plan allows ${limit} team members. Upgrade to add more.` };
      }
      await q(
        "insert into users (business_id, name, email, password_hash, role) values ($1,$2,lower($3),$4,$5)",
        [businessId, d.name, d.email, d.passwordHash, d.role],
      );
      return { ok: true as const };
    });
  } catch (e) {
    if (isUnique(e)) return { error: "That email is already registered" };
    throw e;
  }
}

export async function updateMember(businessId: string, id: string, patch: { role?: "admin" | "employee"; active?: boolean }) {
  await query(
    "update users set role=coalesce($3, role), active=coalesce($4, active) where business_id=$1 and id=$2",
    [businessId, id, patch.role ?? null, patch.active ?? null],
  );
}

export async function deleteMember(businessId: string, id: string) {
  await query("delete from users where business_id=$1 and id=$2", [businessId, id]);
}

/* ----------------------------------------------------------- transactions */

export async function listTransactions(
  businessId: string,
  o: { from?: string; to?: string; limit?: number } = {},
): Promise<Transaction[]> {
  const rows = await query(
    `select ${TX_COLS} from transactions
     where business_id=$1 and ($2::date is null or date >= $2::date) and ($3::date is null or date <= $3::date)
     order by date desc, created_at desc limit $4`,
    [businessId, o.from ?? null, o.to ?? null, o.limit ?? 100_000],
  );
  return rows.map(toTx);
}

export async function hasTransactions(businessId: string): Promise<boolean> {
  return (await query("select 1 from transactions where business_id=$1 limit 1", [businessId])).length > 0;
}

export async function addTransaction(
  businessId: string,
  userId: string,
  t: { type: "income" | "expense"; amount: number; category: string; note: string; date: string },
) {
  const rows = await query(
    `insert into transactions (business_id, type, amount, category, note, date, created_by)
     values ($1,$2,$3,$4,$5,$6,$7) returning ${TX_COLS}`,
    [businessId, t.type, t.amount, t.category, t.note, t.date, userId],
  );
  return toTx(rows[0]);
}

/** ownOnly = userId limits deletion to rows that user created (employees). */
export async function deleteTransaction(businessId: string, id: string, ownOnly?: string): Promise<boolean> {
  if (!isUuid(id)) return false;
  const rows = await query(
    "delete from transactions where id=$1 and business_id=$2 and ($3::uuid is null or created_by=$3::uuid) returning id",
    [id, businessId, ownOnly ?? null],
  );
  return rows.length > 0;
}

export async function loadDemoData(businessId: string, userId: string, rows: DemoRow[]): Promise<boolean> {
  return tx(async (q) => {
    if ((await q("select 1 from transactions where business_id=$1 limit 1", [businessId])).length) return false;
    await insertTransactions(q, businessId, userId, rows);
    return true;
  });
}

/* ---------------------------------------------------------------- reports */

export async function listReports(businessId: string): Promise<Report[]> {
  const rows = await query(`select ${REPORT_COLS} from reports where business_id=$1 order by created_at desc`, [businessId]);
  return rows.map(toReport);
}

export async function getReport(businessId: string, id: string): Promise<Report | null> {
  if (!isUuid(id)) return null;
  const rows = await query(`select ${REPORT_COLS} from reports where business_id=$1 and id=$2`, [businessId, id]);
  return rows[0] ? toReport(rows[0]) : null;
}

export async function insertReport(r: Omit<Report, "id" | "createdAt"> & { key: string }): Promise<Report | null> {
  const rows = await query(
    `insert into reports (business_id, kind, title, from_date, to_date, auto, key, summary)
     values ($1,$2,$3,$4,$5,$6,$7,$8::jsonb) on conflict (business_id, key) do nothing
     returning ${REPORT_COLS}`,
    [r.businessId, r.kind, r.title, r.from, r.to, r.auto, r.key, JSON.stringify(r.summary)],
  );
  return rows[0] ? toReport(rows[0]) : null;
}

export async function deleteReport(businessId: string, id: string): Promise<boolean> {
  if (!isUuid(id)) return false;
  return (await query("delete from reports where business_id=$1 and id=$2 returning id", [businessId, id])).length > 0;
}

export async function listBusinessesWithAutoReports(): Promise<Business[]> {
  return (await query("select * from businesses where auto_weekly or auto_monthly")).map(toBusiness);
}

/* ------------------------------------------------- custom upgrade requests */

const REQUEST_SELECT = `select r.*, b.name as business_name, u.name as requester_name
  from custom_requests r join businesses b on b.id=r.business_id left join users u on u.id=r.requested_by`;

export async function listRequests(businessId: string): Promise<CustomRequest[]> {
  return (await query(`${REQUEST_SELECT} where r.business_id=$1 order by r.created_at desc`, [businessId])).map(toRequest);
}

export async function listAllRequests(): Promise<CustomRequest[]> {
  return (await query(`${REQUEST_SELECT} order by (r.status in ('pending','in_progress')) desc, r.created_at desc`)).map(toRequest);
}

export async function createRequest(
  businessId: string,
  userId: string,
  plan: PlanId,
  d: { title: string; description: string },
): Promise<{ extra: boolean; used: number; allowance: number }> {
  return tx(async (q) => {
    await q("select id from businesses where id=$1 for update", [businessId]);
    const [{ n }] = await q("select count(*)::int as n from custom_requests where business_id=$1 and status<>'declined'", [businessId]);
    const allowance = PLANS[plan].customUpgrades;
    const extra = n >= allowance;
    await q(
      "insert into custom_requests (business_id, requested_by, title, description, extra) values ($1,$2,$3,$4,$5)",
      [businessId, userId, d.title, d.description, extra],
    );
    return { extra, used: n + 1, allowance };
  });
}

export async function countActiveRequests(businessId: string): Promise<number> {
  const [{ n }] = await query("select count(*)::int as n from custom_requests where business_id=$1 and status<>'declined'", [businessId]);
  return n;
}

export async function updateRequest(id: string, patch: { status?: RequestStatus; devNote?: string }): Promise<boolean> {
  if (!isUuid(id)) return false;
  const rows = await query(
    `update custom_requests set status=coalesce($2, status), dev_note=coalesce($3, dev_note), updated_at=now()
     where id=$1 returning id`,
    [id, patch.status ?? null, patch.devNote ?? null],
  );
  return rows.length > 0;
}

/* ------------------------------------------------------------ custom tabs */

const TAB_SELECT = "select t.*, b.name as business_name from custom_tabs t join businesses b on b.id=t.business_id";

export async function listTabs(businessId: string): Promise<CustomTab[]> {
  return (await query(`${TAB_SELECT} where t.business_id=$1 order by t.created_at`, [businessId])).map(toTab);
}

export async function listAllTabs(): Promise<CustomTab[]> {
  return (await query(`${TAB_SELECT} order by b.name, t.created_at`)).map(toTab);
}

export async function getTabById(id: string): Promise<CustomTab | null> {
  if (!isUuid(id)) return null;
  const rows = await query(`${TAB_SELECT} where t.id=$1`, [id]);
  return rows[0] ? toTab(rows[0]) : null;
}

export async function getTabBySlug(businessId: string, slug: string): Promise<CustomTab | null> {
  const rows = await query(`${TAB_SELECT} where t.business_id=$1 and t.slug=$2`, [businessId, slug]);
  return rows[0] ? toTab(rows[0]) : null;
}

export async function createTab(d: {
  businessId: string;
  requestId: string | null;
  title: string;
  slug: string;
  icon: string;
  kind: TabKind;
  access: "all" | "managers";
  config: TabConfig;
  enabled: boolean;
}): Promise<{ id: string } | { error: string }> {
  try {
    return await tx(async (q) => {
      const [row] = await q(
        `insert into custom_tabs (business_id, request_id, title, slug, icon, kind, access, config, enabled)
         values ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9) returning id`,
        [d.businessId, d.requestId, d.title, d.slug, d.icon, d.kind, d.access, JSON.stringify(d.config), d.enabled],
      );
      if (d.requestId) {
        await q("update custom_requests set status='delivered', updated_at=now() where id=$1 and business_id=$2", [d.requestId, d.businessId]);
      }
      return { id: row.id as string };
    });
  } catch (e) {
    if (isUnique(e)) return { error: "That business already has a tab with this address. Change the title or address." };
    throw e;
  }
}

export async function updateTab(
  id: string,
  d: { title: string; slug: string; icon: string; access: "all" | "managers"; config: TabConfig; enabled: boolean },
): Promise<{ error: string } | { ok: true }> {
  try {
    const rows = await query(
      `update custom_tabs set title=$2, slug=$3, icon=$4, access=$5, config=$6::jsonb, enabled=$7 where id=$1 returning id`,
      [id, d.title, d.slug, d.icon, d.access, JSON.stringify(d.config), d.enabled],
    );
    return rows.length ? { ok: true } : { error: "Tab not found" };
  } catch (e) {
    if (isUnique(e)) return { error: "That business already has a tab with this address." };
    throw e;
  }
}

export async function setTabEnabled(id: string, enabled: boolean) {
  await query("update custom_tabs set enabled=$2 where id=$1", [id, enabled]);
}

export async function deleteTab(id: string): Promise<boolean> {
  if (!isUuid(id)) return false;
  return (await query("delete from custom_tabs where id=$1 returning id", [id])).length > 0;
}

/* ---------------------------------------------------------- custom records */

export async function listRecords(tabId: string, businessId: string): Promise<CustomRecord[]> {
  const rows = await query(
    "select id, data, created_at from custom_records where tab_id=$1 and business_id=$2 order by created_at desc limit 2000",
    [tabId, businessId],
  );
  return rows.map(toRecord);
}

export async function insertRecord(tabId: string, businessId: string, userId: string, data: object) {
  const rows = await query(
    "insert into custom_records (tab_id, business_id, created_by, data) values ($1,$2,$3,$4::jsonb) returning id, data, created_at",
    [tabId, businessId, userId, JSON.stringify(data)],
  );
  return toRecord(rows[0]);
}

export async function updateRecord(id: string, tabId: string, businessId: string, data: object): Promise<boolean> {
  if (!isUuid(id)) return false;
  const rows = await query(
    "update custom_records set data=$4::jsonb where id=$1 and tab_id=$2 and business_id=$3 returning id",
    [id, tabId, businessId, JSON.stringify(data)],
  );
  return rows.length > 0;
}

export async function deleteRecord(id: string, tabId: string, businessId: string): Promise<boolean> {
  if (!isUuid(id)) return false;
  return (await query("delete from custom_records where id=$1 and tab_id=$2 and business_id=$3 returning id", [id, tabId, businessId])).length > 0;
}

/* ------------------------------------------------------------- dev console */

export interface BusinessAdminRow {
  id: string;
  name: string;
  slug: string;
  plan: PlanId;
  planRenewsAt: string | null;
  currency: string;
  members: number;
  transactions: number;
  openRequests: number;
  tabs: number;
  createdAt: string;
}

export async function listBusinessesAdmin(): Promise<BusinessAdminRow[]> {
  const rows = await query(`
    select b.*,
      (select count(*)::int from users u where u.business_id=b.id) as members,
      (select count(*)::int from transactions t where t.business_id=b.id) as transactions,
      (select count(*)::int from custom_requests r where r.business_id=b.id and r.status in ('pending','in_progress')) as open_requests,
      (select count(*)::int from custom_tabs c where c.business_id=b.id) as tabs
    from businesses b order by b.created_at desc`);
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    plan: r.plan,
    planRenewsAt: r.plan_renews_at ? iso(r.plan_renews_at) : null,
    currency: String(r.currency).trim(),
    members: r.members,
    transactions: r.transactions,
    openRequests: r.open_requests,
    tabs: r.tabs,
    createdAt: iso(r.created_at),
  }));
}

/* ---------------- push notifications (Dev console → businesses) ---------------- */

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  actionLabel: string | null;
  actionUrl: string | null;
  createdAt: string;
  read: boolean;
}

export interface NotificationAdminRow {
  id: string;
  title: string;
  body: string;
  actionLabel: string | null;
  actionUrl: string | null;
  businessId: string | null;
  businessName: string | null;
  expiresAt: string | null;
  createdAt: string;
  recipients: number;
  reads: number;
}

export async function createNotification(
  createdBy: string,
  d: {
    businessId: string | null;
    title: string;
    body: string;
    actionLabel: string | null;
    actionUrl: string | null;
    expiresInDays: number | null;
  },
): Promise<string | null> {
  if (d.businessId && !isUuid(d.businessId)) return null;
  const rows = await query(
    `insert into notifications (business_id, title, body, action_label, action_url, created_by, expires_at)
     values ($1,$2,$3,$4,$5,$6, case when $7::int is null then null else now() + ($7::int * interval '1 day') end)
     returning id`,
    [d.businessId, d.title, d.body, d.actionLabel, d.actionUrl, createdBy, d.expiresInDays],
  );
  return rows[0]?.id ?? null;
}

export async function deleteNotification(id: string): Promise<boolean> {
  if (!isUuid(id)) return false;
  return (await query("delete from notifications where id=$1 returning id", [id])).length > 0;
}

export async function listNotificationsAdmin(): Promise<NotificationAdminRow[]> {
  const rows = await query(`
    select n.*, b.name as business_name,
      (select count(*)::int from users u
         where (n.business_id is null or u.business_id = n.business_id)) as recipients,
      (select count(*)::int from notification_reads r where r.notification_id = n.id) as reads
    from notifications n left join businesses b on b.id = n.business_id
    order by n.created_at desc limit 100`);
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    body: r.body,
    actionLabel: r.action_label,
    actionUrl: r.action_url,
    businessId: r.business_id,
    businessName: r.business_name,
    expiresAt: r.expires_at ? iso(r.expires_at) : null,
    createdAt: iso(r.created_at),
    recipients: r.recipients,
    reads: r.reads,
  }));
}

/** What one user should see: sent to everyone or to their business and not expired. People who join later still get active ones. */
export async function listNotificationsFor(userId: string, businessId: string): Promise<AppNotification[]> {
  const rows = await query(
    `select n.*, (r.user_id is not null) as is_read
     from notifications n
     left join notification_reads r on r.notification_id = n.id and r.user_id = $1
     where (n.business_id is null or n.business_id = $2)
       and (n.expires_at is null or n.expires_at > now())
     order by n.created_at desc limit 30`,
    [userId, businessId],
  );
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    body: r.body,
    actionLabel: r.action_label,
    actionUrl: r.action_url,
    createdAt: iso(r.created_at),
    read: !!r.is_read,
  }));
}

export async function markNotificationsRead(userId: string, businessId: string, ids: string[] | "all") {
  const list = ids === "all" ? null : ids.filter(isUuid);
  if (list && list.length === 0) return;
  await query(
    `insert into notification_reads (notification_id, user_id)
     select n.id, $1 from notifications n
     where (n.business_id is null or n.business_id = $2)
       and ($3::uuid[] is null or n.id = any($3::uuid[]))
     on conflict do nothing`,
    [userId, businessId, list],
  );
}
