import { notFound } from "next/navigation";
import { TabBuilder, type BuilderInitial } from "@/components/dev/tab-builder";
import { requireDev } from "@/lib/auth";
import { getTabById, listAllRequests, listBusinessesAdmin } from "@/lib/db";
import { isUuid } from "@/lib/sql";

export default async function TabBuilderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ business?: string; request?: string }>;
}) {
  await requireDev();
  const { id } = await params;
  const q = await searchParams;
  const businesses = (await listBusinessesAdmin()).map((b) => ({ id: b.id, name: b.name }));

  let initial: BuilderInitial | null = null;
  let prefill: { businessId?: string; requestId?: string; title?: string; hint?: string } = {};

  if (id !== "new") {
    if (!isUuid(id)) notFound();
    const tab = await getTabById(id);
    if (!tab) notFound();
    initial = {
      id: tab.id,
      businessId: tab.businessId,
      requestId: tab.requestId,
      title: tab.title,
      slug: tab.slug,
      icon: tab.icon,
      kind: tab.kind,
      access: tab.access,
      enabled: tab.enabled,
      config: tab.config,
    };
  } else if (q.request && isUuid(q.request)) {
    const r = (await listAllRequests()).find((x) => x.id === q.request);
    if (r) prefill = { businessId: r.businessId, requestId: r.id, title: r.title, hint: r.description };
  } else if (q.business && isUuid(q.business)) {
    prefill = { businessId: q.business };
  }

  return <TabBuilder initial={initial} businesses={businesses} prefill={prefill} />;
}
