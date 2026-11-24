"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "@teispace/next-themes";
import { motion } from "framer-motion";
import { AlertTriangle, Check, Monitor, Moon, Sun } from "lucide-react";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Dropdown } from "@/components/ui/select";
import { SegmentedControl } from "glisse";
import { actionLabel, renewText, usePlanActions } from "@/components/plan-actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMounted } from "@/components/mounted";
import { ACCENTS, applyAccent } from "@/lib/accent";
import { api, notify, withToast } from "@/lib/client";
import { APP_RELEASE, APP_VERSION, BRAND, CURRENCIES, INDUSTRIES } from "@/lib/brand";
import { fmtLong } from "@/lib/analytics";
import { annualMonthly, planActionFor, PLAN_ORDER, PLANS, type PlanId } from "@/lib/plans";
import { cn } from "@/lib/utils";

interface Props {
  business: {
    name: string;
    slug: string;
    industry: string;
    currency: string;
    plan: PlanId;
    planBilling: "monthly" | "yearly";
    planRenewsAt: string | null;
    createdAt: string;
  };
  membersCount: number;
  user: { name: string; email: string; role: "owner" | "admin" | "employee"; accent: string };
}

const THEMES = [
  { value: "light", label: "Light", icon: Sun, bg: "#fafafa", fg: "#0a0a0a", line: "#e5e5e5" },
  { value: "dark", label: "Dark", icon: Moon, bg: "#141414", fg: "#fafafa", line: "#2a2a2a" },
  { value: "system", label: "System", icon: Monitor, bg: "linear-gradient(90deg,#fafafa 50%,#141414 50%)", fg: "#888", line: "#888" },
];

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

export function Settings({ business, membersCount, user }: Props) {
  const router = useRouter();
  const mounted = useMounted();
  const { theme, setTheme } = useTheme();
  const isManager = user.role !== "employee";
  const isOwner = user.role === "owner";

  const [name, setName] = useState(business.name);
  const [industry, setIndustry] = useState(business.industry);
  const [currency, setCurrency] = useState(business.currency);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [delOpen, setDelOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [accent, setAccent] = useState(user.accent);
  const [billing, setBilling] = useState<"monthly" | "yearly">(business.planBilling);
  const plans = usePlanActions(business.plan);

  const dirty = name !== business.name || industry !== business.industry || currency !== business.currency;

  async function saveBusiness(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const r = await withToast(() => api("/api/business", "PATCH", { name, industry, currency }), {
      loading: "Saving…",
      success: "Business details saved",
      error: "Couldn't save",
    });
    setSaving(false);
    if (r.ok) router.refresh();
  }

  async function pickAccent(id: string, label: string) {
    setAccent(id);
    applyAccent(id);
    notify.success(`${label} colour`, "Applied to buttons and highlights.");
    const r = await api("/api/account", "PATCH", { accent: id });
    if (!r.ok) notify.warning("Saved on this device only", "We couldn't sync it to your account.");
  }

  async function deleteBusiness() {
    setDeleting(true);
    const r = await withToast(() => api("/api/business", "DELETE", { confirm }), {
      loading: "Deleting business…",
      success: "Business deleted",
      error: "Couldn't delete",
    });
    setDeleting(false);
    if (r.ok) {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage how DDash looks and how your business is set up.</p>
      </div>

      <Card id="appearance">
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Choose a theme. It&apos;s saved on this device.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-3">
          {THEMES.map((t) => {
            const selected = mounted && theme === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => {
                  setTheme(t.value);
                  notify.success(`${t.label} theme`, t.value === "system" ? "Following your device." : undefined);
                }}
                className={cn(
                  "group relative rounded-xl border p-2 text-left outline-none transition focus-visible:ring-[3px] focus-visible:ring-ring/50",
                  selected ? "border-foreground" : "hover:border-foreground/40",
                )}
                aria-pressed={selected}
              >
                <div
                  className="relative h-16 overflow-hidden rounded-lg border sm:h-20"
                  style={{ background: t.bg, borderColor: t.line }}
                >
                  <div className="absolute top-2 left-2 h-1.5 w-8 rounded-full" style={{ background: t.fg, opacity: 0.8 }} />
                  <div className="absolute top-5 left-2 h-1.5 w-12 rounded-full" style={{ background: t.fg, opacity: 0.25 }} />
                  <div className="absolute right-2 bottom-2 h-5 w-9 rounded-md" style={{ background: "oklch(0.87 0.2 122)" }} />
                </div>
                <div className="mt-2 flex items-center gap-1.5 px-1 text-sm font-medium">
                  <t.icon className="size-3.5" /> {t.label}
                  {selected && (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="ml-auto">
                      <Check className="size-4" />
                    </motion.span>
                  )}
                </div>
              </button>
            );
          })}
        </CardContent>
      </Card>

      <Card id="colors">
        <CardHeader>
          <CardTitle>Accent colour</CardTitle>
          <CardDescription>Changes buttons, highlights and charts across your dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {ACCENTS.map((a) => {
              const selected = accent === a.id;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => pickAccent(a.id, a.label)}
                  aria-label={a.label}
                  aria-pressed={selected}
                  title={a.label}
                  className={cn(
                    "group flex w-[72px] flex-col items-center gap-2 rounded-xl border p-3 outline-none transition focus-visible:ring-[3px] focus-visible:ring-ring/50",
                    selected ? "border-foreground" : "hover:border-foreground/40",
                  )}
                >
                  <span
                    className="grid size-8 place-items-center rounded-full ring-offset-2 ring-offset-card transition group-hover:scale-110"
                    style={{ background: a.swatch, color: a.ink }}
                  >
                    {selected && <Check className="size-4" />}
                  </span>
                  <span className="text-xs">{a.label}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {isManager ? (
        <Card id="business">
          <CardHeader>
            <CardTitle>Business details</CardTitle>
            <CardDescription>What your team and your reports show.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveBusiness} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="b-name">Business name</Label>
                <Input id="b-name" value={name} onChange={(e) => setName(e.target.value)} minLength={2} maxLength={60} required />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="b-ind">Industry</Label>
                  <Dropdown id="b-ind" value={industry} onChange={setIndustry} options={[...new Set([...INDUSTRIES, industry])]} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="b-cur">Currency</Label>
                  <Dropdown id="b-cur" value={currency} onChange={setCurrency} options={[...new Set([...CURRENCIES, currency])]} />
                </div>
              </div>
              <div>
                <Button type="submit" disabled={!dirty || saving}>
                  Save changes
                </Button>
              </div>
            </form>

            <div className="mt-6 divide-y border-t">
              <Row label="Team members" value={membersCount} />
              <Row label="Plan" value={<Badge tone={business.plan === "starter" ? "default" : "brand"}>{PLANS[business.plan].name}</Badge>} />
              <Row label="Business login" value={<code className="font-mono text-xs">/b/{business.slug}</code>} />
              <Row label="Created" value={fmtLong(business.createdAt.slice(0, 10))} />
              <Row label="Your role" value={<span className="capitalize">{user.role}</span>} />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Your account</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            <Row label="Name" value={user.name} />
            <Row label="Email" value={user.email} />
            <Row label="Business" value={business.name} />
            <Row label="Role" value={<span className="capitalize">{user.role}</span>} />
          </CardContent>
        </Card>
      )}

      {isOwner && (
        <Card id="plan">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Subscription</CardTitle>
                <CardDescription className="mt-1.5">
                  {PLANS[business.plan].name} · {renewText(business.plan, business.planRenewsAt)}
                </CardDescription>
              </div>
              <SegmentedControl
                aria-label="Billing period"
                value={billing}
                onValueChange={(v) => setBilling(v as "monthly" | "yearly")}
                items={[
                  { value: "monthly", label: "Monthly" },
                  { value: "yearly", label: "Yearly −20%" },
                ]}
              />
            </div>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-3">
              {PLAN_ORDER.map((id) => {
                const plan = PLANS[id];
                const action = planActionFor(business.plan, id);
                const price = billing === "yearly" ? annualMonthly(plan) : plan.priceMonthly;
                return (
                  <div key={id} className={cn("flex flex-col gap-3 rounded-xl border p-4", id === business.plan && "border-foreground")}>
                    <div>
                      <div className="flex items-center justify-between font-medium">
                        {plan.name}
                        {id === business.plan && <Badge tone="brand">Current</Badge>}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {price === 0 ? "Free" : `$${Number.isInteger(price) ? price : price.toFixed(2)}/mo`}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {plan.maxMembers === Infinity ? "Unlimited" : plan.maxMembers} members · {plan.customUpgrades} custom upgrades
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={action === "upgrade" || action === "renew" ? "brand" : "outline"}
                      disabled={action === "current" || plans.busy}
                      onClick={() => plans.choose(id, billing)}
                      className="mt-auto"
                    >
                      {actionLabel(action, id)}
                    </Button>
                  </div>
                );
              })}
            </div>
            {business.plan !== "starter" && (
              <div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm font-medium">Cancel subscription</div>
                  <p className="text-sm text-muted-foreground">Move to the free Starter plan. Your data stays.</p>
                </div>
                <Button variant="outline" onClick={plans.cancelSubscription}>
                  Cancel subscription
                </Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Compare every feature on the{" "}
              <Link href="/#pricing" className="underline underline-offset-4">
                pricing page
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      )}
      {plans.dialog}

      <Card id="about">
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          <Row label="App version" value={<Badge tone="outline">v{APP_VERSION}</Badge>} />
          <Row label="Released" value={APP_RELEASE} />
          <Row
            label="Built by"
            value={
              <a href={BRAND.companyUrl} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                {BRAND.company}
              </a>
            }
          />
        </CardContent>
      </Card>

      {isOwner && (
        <Card id="danger" className="border-destructive/40">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-4" />
              <CardTitle className="text-destructive">Danger zone</CardTitle>
            </div>
            <CardDescription>Permanent actions. There is no undo.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3 rounded-lg border border-destructive/30 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-medium">Delete this business</div>
                <p className="text-sm text-muted-foreground">
                  Removes all transactions, reports and team accounts for {business.name}.
                </p>
              </div>
              <Button variant="destructive" onClick={() => setDelOpen(true)}>
                Delete business
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={delOpen} onOpenChange={setDelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {business.name}?</DialogTitle>
            <DialogDescription>
              This permanently deletes the business and every account in it. Type the business name to confirm.
            </DialogDescription>
          </DialogHeader>
          <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder={business.name} aria-label="Business name" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDelOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={confirm !== business.name || deleting} onClick={deleteBusiness}>
              Delete permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
