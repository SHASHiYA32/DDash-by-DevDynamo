import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CustomTabView } from "@/components/custom/tab-view";
import { isManager, requireSession } from "@/lib/auth";
import { getTabBySlug, listRecords } from "@/lib/db";
import { planHas } from "@/lib/plans";

export const metadata: Metadata = { title: "Custom tab" };

export default async function CustomTabPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, business } = await requireSession();
  if (!planHas(business.plan, "customTabs")) redirect("/dashboard");

  const tab = await getTabBySlug(business.id, slug);
  if (!tab || !tab.enabled) notFound();
  if (tab.access === "managers" && !isManager(user.role)) redirect("/dashboard");

  const records = tab.kind === "data" ? await listRecords(tab.id, business.id) : [];
  return <CustomTabView tab={{ id: tab.id, title: tab.title, kind: tab.kind, config: tab.config }} records={records} />;
}
