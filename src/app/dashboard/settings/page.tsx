import type { Metadata } from "next";
import { Settings } from "@/components/dashboard/settings";
import { requireSession } from "@/lib/auth";
import { countMembers } from "@/lib/db";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { user, business } = await requireSession();
  const membersCount = await countMembers(business.id);

  return (
    <Settings
      business={{
        name: business.name,
        slug: business.slug,
        industry: business.industry,
        currency: business.currency,
        plan: business.plan,
        planBilling: business.planBilling,
        planRenewsAt: business.planRenewsAt,
        createdAt: business.createdAt,
      }}
      membersCount={membersCount}
      user={{ name: user.name, email: user.email, role: user.role, accent: user.accent }}
    />
  );
}
