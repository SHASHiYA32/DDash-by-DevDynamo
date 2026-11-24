import { DevConsole } from "@/components/dev/console";
import { requireDev } from "@/lib/auth";
import { pushEnabled } from "@/lib/push";
import { listAllRequests, listAllTabs, listBusinessesAdmin, listNotificationsAdmin, countPushSubscriptions } from "@/lib/db";

export default async function DevPage() {
  await requireDev();
  const [businesses, requests, tabs, notifications, devices] = await Promise.all([
    listBusinessesAdmin(),
    listAllRequests(),
    listAllTabs(),
    listNotificationsAdmin(),
    pushEnabled ? countPushSubscriptions() : Promise.resolve(0),
  ]);
  return (
    <DevConsole
      businesses={businesses}
      requests={requests}
      notifications={notifications}
      pushReady={pushEnabled}
      pushDevices={devices}
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
