import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { APP_VERSION, BRAND } from "@/lib/brand";

export function FinalCta() {
  return (
    <section className="px-5 pb-20">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-neutral-950 px-6 py-16 text-center text-neutral-50 sm:py-20">
        <div className="bg-grid absolute inset-0 opacity-50 [--foreground:white]" />
        <div className="absolute -top-24 left-1/2 size-80 -translate-x-1/2 rounded-full bg-brand/30 blur-[100px]" />
        <div className="relative">
          <h2 className="mx-auto max-w-xl text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
            Give your business the dashboard it deserves
          </h2>
          <p className="mx-auto mt-4 max-w-md text-neutral-400">
            Register in a minute. Start on the free plan and upgrade only when you need to.
          </p>
          <Button asChild size="lg" variant="brand" className="mt-8">
            <Link href="/register">
              Register your business <ArrowRight />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">{BRAND.tagline}</p>
        </div>
        <div className="text-sm text-muted-foreground sm:text-right">
          <div>
            A product by{" "}
            <a href={BRAND.companyUrl} target="_blank" rel="noreferrer" className="font-medium text-foreground underline underline-offset-4">
              {BRAND.company}
            </a>
          </div>
          <div className="mt-1">
            © {new Date().getFullYear()} {BRAND.company} · v{APP_VERSION}
          </div>
        </div>
      </div>
    </footer>
  );
}
