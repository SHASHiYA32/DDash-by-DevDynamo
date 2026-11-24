import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: true }, alternates: { canonical: "/login" } };

export default async function LoginPage() {
  if (await getSession()) redirect("/dashboard");
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your DDash workspace."
      footer={
        <>
          New here?{" "}
          <Link href="/register" className="font-medium text-foreground underline underline-offset-4">
            Register your business
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
