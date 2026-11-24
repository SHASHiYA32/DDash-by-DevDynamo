import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { BRAND } from "@/lib/brand";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-neutral-950 p-10 text-neutral-50 lg:flex lg:flex-col">
        <div className="bg-grid absolute inset-0 opacity-60 [--foreground:white]" />
        <div className="absolute -bottom-40 -left-24 size-[28rem] rounded-full bg-brand/25 blur-[110px]" />
        <Logo className="relative text-white" />
        <div className="relative mt-auto max-w-md">
          <h2 className="text-4xl leading-[1.1] font-semibold tracking-tight">
            Every sale. Every shift. <span className="text-brand">One dashboard.</span>
          </h2>
          <p className="mt-4 text-neutral-400">
            Track income and expenses, invite your team, and let DDash send the weekly and monthly
            reports for you.
          </p>
          <p className="mt-10 text-xs text-neutral-500">
            A product by{" "}
            <a href={BRAND.companyUrl} target="_blank" rel="noreferrer" className="underline underline-offset-4">
              {BRAND.company}
            </a>
          </p>
        </div>
      </aside>

      <main className="flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Home
          </Link>
          <ThemeToggle />
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <div className="lg:hidden">
            <Logo className="mb-8" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
