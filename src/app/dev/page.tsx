import { DevConsole } from "@/components/dev/console";
import { requireDev } from "@/lib/auth";
import { listAllRequests, listAllTabs, listBusinessesAdmin } from "@/lib/db";

export default async function DevPage() {
  await requireDev();
  const [businesses, requests, tabs] = await Promise.all([listBusinessesAdmin(), listAllRequests(), listAllTabs()]);
  return (
    <DevConsole
      businesses={businesses}
      requests={requests}
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
