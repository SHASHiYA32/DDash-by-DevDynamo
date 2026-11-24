"use client";

import { FAQS } from "@/lib/faq";
import { motion } from "framer-motion";
import {
  BarChart3,
  CalendarClock,
  FileBarChart,
  Globe2,
  Moon,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: BarChart3,
    title: "Animated charts",
    body: "Income, expenses and profit move and update as your numbers do. See what changed at a glance.",
    wide: true,
  },
  {
    icon: CalendarClock,
    title: "Automatic reports",
    body: "Weekly and monthly summaries appear on their own, right after each period closes.",
  },
  {
    icon: Users,
    title: "Employee logins",
    body: "Add your team and share a branded login page. Owners, admins and employees each see what they should.",
  },
  {
    icon: FileBarChart,
    title: "One-click reports",
    body: "Generate a clean report for any period, then print it or save it as a PDF.",
  },
  {
    icon: Globe2,
    title: "Any currency",
    body: "Works for businesses anywhere. Pick your currency once and every figure follows.",
  },
  {
    icon: Moon,
    title: "Light & dark",
    body: "Pick a theme in settings, or follow your device. Easy on the eyes at 2 a.m.",
  },
  {
    icon: ShieldCheck,
    title: "Private by design",
    body: "Every business gets its own separate workspace. Employees only see their own scope.",
    wide: true,
  },
];

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-medium text-muted-foreground">Features</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Everything a business owner checks, in one place
        </h2>
      </div>
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: (i % 3) * 0.07, ease: [0.16, 1, 0.3, 1] }}
            className={cn(f.wide && "lg:col-span-2")}
          >
            <Card className="group h-full p-6 transition-colors hover:border-foreground/30">
              <span className="grid size-10 place-items-center rounded-lg bg-secondary transition group-hover:bg-brand group-hover:text-brand-foreground">
                <f.icon className="size-5" />
              </span>
              <h3 className="mt-5 text-lg font-semibold tracking-tight">{f.title}</h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

const STEPS = [
  { n: "01", title: "Register your business", body: "Name it, pick your currency, and choose a plan. It takes about a minute." },
  { n: "02", title: "Add your team", body: "Create logins for employees and share your business's own sign-in page." },
  { n: "03", title: "Watch it work", body: "Record sales and expenses, and let DDash turn them into charts and reports." },
];

export function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-20 border-y bg-muted/40">
      <div className="mx-auto max-w-6xl px-5 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-muted-foreground">How it works</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Up and running today</h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <div className="font-mono text-sm text-muted-foreground">{s.n}</div>
              <h3 className="mt-3 text-xl font-semibold tracking-tight">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Faq() {
  return (
    <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-5 py-20">
      <h2 className="text-center text-3xl font-semibold tracking-tight sm:text-4xl">Questions</h2>
      <div className="mt-10 divide-y rounded-2xl border bg-card">
        {FAQS.map((f) => (
          <details key={f.q} className="group px-6 py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-medium [&::-webkit-details-marker]:hidden">
              {f.q}
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-secondary text-base leading-none transition group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
