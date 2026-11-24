"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Glass } from "glisse";
import { ArrowRight, FileBarChart, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CountUp } from "@/components/count-up";
import { CategoryDonut, RevenueChart, Sparkline } from "@/components/dashboard/charts";
import type { CatTotal, DayPoint } from "@/lib/analytics";

const SAMPLE: DayPoint[] = Array.from({ length: 30 }, (_, i) => {
  const income = 1400 + Math.sin(i / 3.1) * 380 + i * 34 + ((i * 53) % 7) * 40;
  const expense = 820 + Math.cos(i / 4) * 160 + ((i * 37) % 5) * 30;
  const d = new Date(Date.UTC(2026, 9, 1 + i)).toISOString().slice(0, 10);
  return { date: d, income: Math.round(income), expense: Math.round(expense), net: Math.round(income - expense) };
});

const CATS: CatTotal[] = [
  { category: "Inventory", total: 9200 },
  { category: "Salaries", total: 6800 },
  { category: "Rent", total: 3600 },
  { category: "Marketing", total: 2100 },
];

const fade = (i: number) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay: 0.08 * i, ease: [0.16, 1, 0.3, 1] as const },
});

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="bg-grid absolute inset-0 -z-10" />
      <div className="absolute top-[-12rem] left-1/2 -z-10 size-[40rem] -translate-x-1/2 rounded-full bg-brand/25 blur-[140px]" />

      <div className="mx-auto max-w-6xl px-5 pt-16 pb-10 text-center sm:pt-24">
        <motion.div
          {...fade(0)}
          className="mx-auto inline-flex items-center gap-2 rounded-full border bg-card/70 px-3.5 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur"
        >
          <span className="size-1.5 rounded-full bg-brand shadow-[0_0_0_3px_color-mix(in_oklab,var(--brand)_35%,transparent)]" />
          Built for every kind of business
        </motion.div>

        <motion.h1
          {...fade(1)}
          className="mx-auto mt-6 max-w-3xl text-[2.6rem] leading-[1.04] font-semibold tracking-tight text-balance sm:text-6xl"
        >
          Your whole business, <span className="bg-brand px-2 text-brand-foreground">one dashboard.</span>
        </motion.h1>

        <motion.p {...fade(2)} className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground text-balance">
          Track income and expenses, give every employee their own login, and get weekly and monthly
          reports without lifting a finger.
        </motion.p>

        <motion.div {...fade(3)} className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" variant="brand">
            <Link href="/register">
              Register your business <ArrowRight />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="#pricing">See pricing</a>
          </Button>
        </motion.div>
        <motion.p {...fade(4)} className="mt-4 text-xs text-muted-foreground">
          Free Starter plan · No card needed
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="relative mx-auto max-w-5xl px-4 pb-20"
      >
        <div data-glisse-backdrop className="rounded-3xl border bg-card/60 p-3 shadow-2xl shadow-black/10 backdrop-blur sm:p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "Income", value: 52_480, color: "var(--chart-2)" },
              { label: "Expenses", value: 31_260, color: "var(--chart-1)" },
              { label: "Net profit", value: 21_220, color: "var(--chart-3)" },
            ].map((k) => (
              <Card key={k.label} className="relative overflow-hidden p-4 text-left">
                <div className="text-xs text-muted-foreground">{k.label}</div>
                <div className="mt-1 text-2xl font-semibold tabular-nums">
                  <CountUp value={k.value} kind="money" currency="USD" />
                </div>
                <div className="pointer-events-none absolute right-0 bottom-0 h-12 w-1/2 opacity-80">
                  <Sparkline values={SAMPLE.map((d, i) => (k.label === "Expenses" ? d.expense : k.label === "Net profit" ? d.net : d.income) + i)} color={k.color} />
                </div>
              </Card>
            ))}
          </div>
          <div className="mt-3 grid gap-3 lg:grid-cols-3">
            <Card className="p-4 text-left lg:col-span-2">
              <div className="mb-2 text-sm font-medium">Income vs expenses</div>
              <div className="h-56">
                <RevenueChart data={SAMPLE} currency="USD" />
              </div>
            </Card>
            <Card className="hidden p-4 text-left lg:block">
              <div className="mb-2 text-sm font-medium">Where the money goes</div>
              <div className="h-56">
                <CategoryDonut data={CATS} currency="USD" />
              </div>
            </Card>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="absolute -top-5 right-8 hidden sm:block"
        >
          <Glass style={{ borderRadius: 22, padding: "12px 16px" }}>
            <div className="flex items-center gap-3 text-left text-sm">
              <FileBarChart className="size-5" />
              <div>
                <div className="font-medium">Weekly report ready</div>
                <div className="text-xs opacity-70">Sent every Monday, automatically</div>
              </div>
            </div>
          </Glass>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.3, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="absolute bottom-10 left-8 hidden sm:block"
        >
          <Glass style={{ borderRadius: 22, padding: "12px 16px" }}>
            <div className="flex items-center gap-3 text-left text-sm">
              <Users className="size-5" />
              <div>
                <div className="font-medium">Maya joined your team</div>
                <div className="text-xs opacity-70">Employee login</div>
              </div>
            </div>
          </Glass>
        </motion.div>
      </motion.div>
    </section>
  );
}
