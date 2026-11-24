import { NextRequest } from "next/server";
import { z } from "zod";
import { fail, getSession, ok } from "@/lib/auth";
import { createTab, deleteTab, getBusinessById, setTabEnabled, updateTab } from "@/lib/db";
import { isUuid } from "@/lib/sql";
import { isReservedSlug, normalizeConfig, slugFromTitle, TAB_ICON_KEYS } from "@/lib/custom";

const base = z.object({
  title: z.string().trim().min(2, "Give the tab a title").max(40),
  slug: z.string().trim().max(40).optional(),
  icon: z.string().refine((i) => (TAB_ICON_KEYS as readonly string[]).includes(i), "Pick an icon"),
  kind: z.enum(["data", "page"]),
  access: z.enum(["all", "managers"]),
  enabled: z.boolean(),
  config: z.unknown(),
});

function prepare(b: z.infer<typeof base>) {
  const slug = slugFromTitle(b.slug || b.title);
  if (isReservedSlug(slug)) return { error: `“${slug}” is reserved, choose another address` } as const;
  const cfg = normalizeConfig(b.kind, b.config);
  if (!cfg.ok) return { error: cfg.error } as const;
  return { slug, config: cfg.value } as const;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.isDev) return fail("Not allowed", 403);
  const raw = await req.json().catch(() => null);
  const parsed = base.extend({ businessId: z.string(), requestId: z.string().nullish() }).safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const b = parsed.data;
  if (!isUuid(b.businessId) || !(await getBusinessById(b.businessId))) return fail("Choose a business");
  const p = prepare(b);
  if (p.error !== undefined) return fail(p.error);

  const result = await createTab({
    businessId: b.businessId,
    requestId: b.requestId && isUuid(b.requestId) ? b.requestId : null,
    title: b.title,
    slug: p.slug,
    icon: b.icon,
    kind: b.kind,
    access: b.access,
    config: p.config,
    enabled: b.enabled,
  });
  return "error" in result ? fail(result.error, 409) : ok({ id: result.id });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session?.isDev) return fail("Not allowed", 403);
  const raw = await req.json().catch(() => null);

  // quick enable/disable switch from the list
  if (raw && typeof raw.id === "string" && typeof raw.enabled === "boolean" && Object.keys(raw).length === 2) {
    if (!isUuid(raw.id)) return fail("Tab not found", 404);
    await setTabEnabled(raw.id, raw.enabled);
    return ok();
  }

  const parsed = base.extend({ id: z.string() }).safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const b = parsed.data;
  if (!isUuid(b.id)) return fail("Tab not found", 404);
  const p = prepare(b);
  if (p.error !== undefined) return fail(p.error);

  const result = await updateTab(b.id, {
    title: b.title,
    slug: p.slug,
    icon: b.icon,
    access: b.access,
    config: p.config,
    enabled: b.enabled,
  });
  return "error" in result ? fail(result.error, 409) : ok();
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session?.isDev) return fail("Not allowed", 403);
  const id = req.nextUrl.searchParams.get("id") ?? "";
  return (await deleteTab(id)) ? ok() : fail("Tab not found", 404);
}
