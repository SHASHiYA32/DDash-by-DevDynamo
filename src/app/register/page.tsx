import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";
import { getSession } from "@/lib/auth";
import type { PlanId } from "@/lib/plans";

export const metadata: Metadata = {
  title: "Register your business: free business dashboard",
  description: "Create your DDash workspace in a minute. Free Starter plan, no card needed.",
  alternates: { canonical: "/register" },
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  if (await getSession()) redirect("/dashboard");
  const { plan } = await searchParams;
  const defaultPlan: PlanId = plan === "growth" || plan === "scale" ? plan : "starter";

  return (
    <AuthShell
      title="Register your business"
      subtitle="Create your workspace in under a minute."
      footer={
        <>
          Already registered?{" "}
          <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm defaultPlan={defaultPlan} />
    </AuthShell>
  );
}
