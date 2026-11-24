"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "glisse";
import { Input, Label } from "@/components/ui/input";
import { Dropdown } from "@/components/ui/select";
import { api, notify } from "@/lib/client";
import { CURRENCIES, INDUSTRIES } from "@/lib/brand";
import { PLAN_ORDER, PLANS, type PlanId } from "@/lib/plans";
import { cn } from "@/lib/utils";

export function RegisterForm({ defaultPlan }: { defaultPlan: PlanId }) {
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState<string>(INDUSTRIES[0]);
  const [currency, setCurrency] = useState<string>("USD");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [plan, setPlan] = useState<PlanId>(defaultPlan);
  const [demoData, setDemoData] = useState(true);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const r = await api("/api/auth/register", "POST", {
      businessName,
      industry,
      currency,
      ownerName,
      email,
      password,
      plan,
      demoData,
    });
    if (!r.ok) {
      setBusy(false);
      notify.error("Couldn't create your account", r.error);
      return;
    }
    notify.success("Business created", `Welcome to DDash, ${ownerName.split(" ")[0]}.`);
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="grid gap-5">
      <fieldset className="grid gap-4">
        <legend className="mb-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Your business
        </legend>
        <div className="grid gap-2">
          <Label htmlFor="bn">Business name</Label>
          <Input id="bn" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Acme Coffee Co." required minLength={2} maxLength={60} autoFocus />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label htmlFor="ind">Industry</Label>
            <Dropdown id="ind" value={industry} onChange={setIndustry} options={INDUSTRIES} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cur">Currency</Label>
            <Dropdown id="cur" value={currency} onChange={setCurrency} options={CURRENCIES} />
          </div>
        </div>
      </fieldset>

      <fieldset className="grid gap-4">
        <legend className="mb-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Owner account
        </legend>
        <div className="grid gap-2">
          <Label htmlFor="on">Your name</Label>
          <Input id="on" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} autoComplete="name" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="em">Email</Label>
          <Input id="em" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="pw">Password</Label>
          <div className="relative">
            <Input
              id="pw"
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
              className="pr-10"
              placeholder="At least 8 characters"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
              aria-label={show ? "Hide password" : "Show password"}
            >
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>
      </fieldset>

      <fieldset className="grid gap-3">
        <legend className="mb-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Plan
        </legend>
        <div className="grid grid-cols-3 gap-2">
          {PLAN_ORDER.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setPlan(id)}
              aria-pressed={plan === id}
              className={cn(
                "rounded-xl border p-3 text-left outline-none transition focus-visible:ring-[3px] focus-visible:ring-ring/50",
                plan === id ? "border-foreground bg-accent" : "hover:border-foreground/40",
              )}
            >
              <div className="flex items-center justify-between text-sm font-medium">
                {PLANS[id].name}
                {plan === id && <Check className="size-3.5" />}
              </div>
              <div className="text-xs text-muted-foreground">
                {PLANS[id].priceMonthly === 0 ? "Free" : `$${PLANS[id].priceMonthly}/mo`}
              </div>
            </button>
          ))}
        </div>
      </fieldset>

      <div className="flex items-center justify-between gap-4 rounded-xl border p-3 text-sm">
        <div>
          <div className="font-medium">Start with sample data</div>
          <div className="text-muted-foreground">Fills the charts so you can explore right away.</div>
        </div>
        <Switch aria-label="Start with sample data" checked={demoData} onCheckedChange={setDemoData} />
      </div>

      <Button type="submit" size="lg" disabled={busy}>
        {busy ? "Creating your business…" : "Create business"}
      </Button>
    </form>
  );
}
