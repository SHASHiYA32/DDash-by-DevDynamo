import { DevConsole } from "@/components/dev/console";
import { requireDev } from "@/lib/auth";
import { listAllRequests, listAllTabs, listBusinessesAdmin, listNotificationsAdmin } from "@/lib/db";

export default async function DevPage() {
  await requireDev();
  const [businesses, requests, tabs, notifications] = await Promise.all([
    listBusinessesAdmin(),
    listAllRequests(),
    listAllTabs(),
    listNotificationsAdmin(),
  ]);
  return (
    <DevConsole
      businesses={businesses}
      requests={requests}
      notifications={notifications}
      tabs={tabs.map((t) => ({
        id: t.id,
        businessName: t.businessName ?? "",
        title: t.title,
        slug: t.slug,
        icon: t.icon,
        kind: t.kind,
        enabled: t.enabled,
        access: t.access,
      }))}
    />
  );
}
