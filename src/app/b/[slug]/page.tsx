import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth";
import { getBusinessBySlug } from "@/lib/db";

export const metadata: Metadata = { title: "Team sign in", robots: { index: false, follow: false } };

export default async function EmployeePortal({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (await getSession()) redirect("/dashboard");

  const business = await getBusinessBySlug(slug);

  if (!business || !business.employeePortal) {
    return (
      <AuthShell title="Login unavailable" subtitle="This team login page isn't active.">
        <div className="grid gap-4 rounded-xl border p-5 text-sm text-muted-foreground">
          <LockKeyhole className="size-5 text-foreground" />
          <p>
            The business owner may have turned off employee login, or the link is wrong. Ask your
            manager for an updated link.
          </p>
          <Button asChild variant="outline" className="justify-self-start">
            <Link href="/login">Go to main sign in</Link>
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={`Sign in to ${business.name}`}
      subtitle="Use the email and password your manager gave you."
    >
      <LoginForm businessSlug={business.slug} />
    </AuthShell>
  );
}
