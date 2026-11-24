import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/shell";
import { isManager, requireSession } from "@/lib/auth";
import { listTabs } from "@/lib/db";
import { planHas } from "@/lib/plans";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, business, isDev } = await requireSession();
  const hasCustom = planHas(business.plan, "customTabs");
  const manager = isManager(user.role);
  const tabs = hasCustom
    ? (await listTabs(business.id)).filter((t) => t.enabled && (t.access === "all" || manager))
    : [];

  return (
    <DashboardShell
      user={{ name: user.name, email: user.email, role: user.role, accent: user.accent }}
      business={{ name: business.name, plan: business.plan }}
      customTabs={tabs.map((t) => ({ slug: t.slug, title: t.title, icon: t.icon }))}
      showCustomHub={hasCustom && manager}
      isDev={isDev}
    >
      {children}
    </DashboardShell>
  );
}
