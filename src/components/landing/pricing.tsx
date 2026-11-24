"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { SegmentedControl } from "glisse";
import { Check, Minus } from "lucide-react";
import { Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { actionLabel, renewText, usePlanActions } from "@/components/plan-actions";
import { annualMonthly, planActionFor, PLAN_ORDER, PLANS, type PlanId } from "@/lib/plans";
import { cn } from "@/lib/utils";

const ROWS: { label: string; values: (string | boolean)[] }[] = [
  { label: "Team members", values: ["3", "15", "Unlimited"] },
  { label: "Income & expense tracking", values: [true, true, true] },
  { label: "Live revenue chart", values: [true, true, true] },
  { label: "Employee login page", values: [true, true, true] },
  { label: "All animated charts", values: [false, true, true] },
  { label: "Report generation (print / PDF)", values: [false, true, true] },
  { label: "CSV export", values: [false, true, true] },
  { label: "Automatic weekly reports", values: [false, true, true] },
  { label: "Automatic monthly reports", values: [false, false, true] },
  { label: "Custom date-range reports", values: [false, false, true] },
  { label: "Custom upgrades from our developers", values: ["—", "3 included", "5 included"] },
  { label: "Priority support", values: [false, false, true] },
];

function Cell({ v }: { v: string | boolean }) {
  if (typeof v === "string") return <span className="text-sm font-medium">{v}</span>;
  return v ? (
    <Check className="mx-auto size-4" aria-label="Included" />
  ) : (
    <Minus className="mx-auto size-4 text-muted-foreground/50" aria-label="Not included" />
  );
}

export interface CurrentSub {
  plan: PlanId;
  renewsAt: string | null;
  role: "owner" | "admin" | "employee";
}

export function Pricing({ current }: { current: CurrentSub | null }) {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const yearly = billing === "yearly";
  const actions = usePlanActions(current?.plan ?? "starter");
  const isOwner = current?.role === "owner";

  return (
    <section id="pricing" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-medium text-muted-foreground">Pricing</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          {current ? "Renew, upgrade or change your plan" : "Start free. Pay when you grow."}
        </h2>
        <div className="mt-8 flex items-center justify-center gap-3">
          <SegmentedControl
            aria-label="Billing period"
            value={billing}
            onValueChange={(v) => setBilling(v as "monthly" | "yearly")}
            items={[
              { value: "monthly", label: "Monthly" },
              { value: "yearly", label: "Yearly" },
            ]}
          />
          <Badge tone="brand">Save 20%</Badge>
        </div>
      </div>

      <div className="mt-12 grid gap-5 lg:grid-cols-3">
        {PLAN_ORDER.map((id: PlanId, i) => {
          const plan = PLANS[id];
          const price = yearly ? annualMonthly(plan) : plan.priceMonthly;
          const action = current ? planActionFor(current.plan, id) : "start";
          const mine = current?.plan === id;
          return (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-card p-7",
                (plan.popular || mine) && "border-foreground shadow-xl shadow-black/5",
                plan.popular && !current && "lg:-mt-3 lg:mb-3",
              )}
            >
              {mine ? (
                <Badge tone="brand" className="absolute -top-3 left-7">
                  Your plan
                </Badge>
              ) : (
                plan.popular && (
                  <Badge tone="brand" className="absolute -top-3 left-7">
                    Most popular
                  </Badge>
                )
              )}
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-5xl font-semibold tracking-tight tabular-nums">
                  ${Number.isInteger(price) ? price : price.toFixed(2)}
                </span>
                <span className="text-sm text-muted-foreground">/month</span>
              </div>
              <p className="mt-1 h-4 text-xs text-muted-foreground">
                {mine && current
                  ? renewText(current.plan, current.renewsAt)
                  : plan.priceMonthly === 0
                    ? "Free forever"
                    : yearly
                      ? "Billed yearly"
                      : "Billed monthly"}
              </p>

              {!current ? (
                <Button asChild size="lg" variant={plan.popular ? "brand" : "outline"} className="mt-6">
                  <Link href={`/register?plan=${id}`}>
                    {plan.priceMonthly === 0 ? "Start free" : `Get ${plan.name}`}
                  </Link>
                </Button>
              ) : isOwner ? (
                <Button
                  size="lg"
                  variant={action === "upgrade" || action === "renew" ? "brand" : "outline"}
                  className="mt-6"
                  disabled={action === "current" || actions.busy}
                  onClick={() => actions.choose(id, billing)}
                >
                  {actionLabel(action, id)}
                </Button>
              ) : (
                <Button size="lg" variant="outline" className="mt-6" disabled>
                  {mine ? "Your business plan" : "Owner manages plans"}
                </Button>
              )}

              <ul className="mt-7 grid gap-3 text-sm">
                {plan.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 size-4 shrink-0" />
                    {h}
                  </li>
                ))}
              </ul>
            </motion.div>
          );
        })}
      </div>

      <p className="mx-auto mt-6 max-w-xl text-center text-sm text-muted-foreground">
        Need more custom upgrades than your plan includes? Extra ones are available as paid add-ons, just ask our developers.
      </p>

      <div className="mt-12 overflow-x-auto rounded-2xl border bg-card">
        <table className="w-full min-w-[560px] text-left">
          <thead>
            <tr className="border-b text-sm">
              <th className="p-4 font-medium text-muted-foreground">Compare plans</th>
              {PLAN_ORDER.map((id) => (
                <th key={id} className="w-32 p-4 text-center font-semibold">
                  {PLANS[id].name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.label} className="border-b last:border-0">
                <td className="p-4 text-sm">{r.label}</td>
                {r.values.map((v, i) => (
                  <td key={i} className="p-4 text-center">
                    <Cell v={v} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {actions.dialog}
    </section>
  );
}
