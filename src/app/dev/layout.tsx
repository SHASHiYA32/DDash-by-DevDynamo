import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/card";
import { requireDev } from "@/lib/auth";

export const metadata: Metadata = { title: "Dev console", robots: { index: false, follow: false } };

export default async function DevLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireDev();
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Logo href="/dev" />
            <Badge tone="brand">Dev console</Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-muted-foreground sm:inline">{user.email}</span>
            <ThemeToggle />
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground">
              <ArrowLeft className="size-4" /> Dashboard
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl p-4 pb-16 md:p-8">{children}</main>
    </div>
  );
}
