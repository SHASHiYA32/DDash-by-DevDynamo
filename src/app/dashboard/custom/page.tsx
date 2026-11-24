import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CustomHub } from "@/components/custom/hub";
import { requireManager } from "@/lib/auth";
import { countActiveRequests, listRequests, listTabs } from "@/lib/db";
import { customAllowance, planHas, PLANS } from "@/lib/plans";

export const metadata: Metadata = { title: "Custom upgrades" };

export default async function CustomPage() {
  const { business } = await requireManager();
  if (!planHas(business.plan, "customTabs")) redirect("/dashboard/settings#plan");

  const [requests, tabs, used] = await Promise.all([
    listRequests(business.id),
    listTabs(business.id),
    countActiveRequests(business.id),
  ]);

  return (
    <CustomHub
      planName={PLANS[business.plan].name}
      allowance={customAllowance(business.plan)}
      used={used}
      requests={requests.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        status: r.status,
        extra: r.extra,
        devNote: r.devNote,
        createdAt: r.createdAt,
      }))}
      tabs={tabs.filter((t) => t.enabled).map((t) => ({ slug: t.slug, title: t.title, icon: t.icon, kind: t.kind }))}
    />
  );
}
