import type { Metadata } from "next";
import { Team } from "@/components/dashboard/team";
import { requireManager } from "@/lib/auth";
import { listMembers } from "@/lib/db";
import { memberLimit, PLANS } from "@/lib/plans";

export const metadata: Metadata = { title: "Team" };

export default async function EmployeesPage() {
  const { user, business } = await requireManager();
  const members = await listMembers(business.id);
  const limit = memberLimit(business.plan);

  return (
    <Team
      members={members}
      limit={Number.isFinite(limit) ? limit : -1}
      planName={PLANS[business.plan].name}
      userId={user.id}
      userRole={user.role}
      slug={business.slug}
      portalEnabled={business.employeePortal}
    />
  );
}
