"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api, withToast } from "@/lib/client";
import { fmtLong } from "@/lib/analytics";
import { PLANS, planActionFor, type PlanAction, type PlanId } from "@/lib/plans";

export type Billing = "monthly" | "yearly";

export function actionLabel(action: PlanAction, target: PlanId) {
  switch (action) {
    case "renew":
      return "Renew plan";
    case "upgrade":
      return `Upgrade to ${PLANS[target].name}`;
    case "downgrade":
      return target === "starter" ? "Downgrade to Free" : `Switch to ${PLANS[target].name}`;
    case "current":
      return "Current plan";
    default:
      return "Get started";
  }
}

export function renewText(plan: PlanId, renewsAt: string | null) {
  if (plan === "starter" || !renewsAt) return "Free plan, no renewal date";
  return `Renews on ${fmtLong(renewsAt.slice(0, 10))}`;
}

/**
 * Renew / upgrade / downgrade / cancel for the signed-in owner.
 * Downgrades and cancellation ask for confirmation first.
 * `dialog` must be rendered once somewhere in the component.
 */
export function usePlanActions(current: PlanId) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<{ plan: PlanId; billing: Billing; cancel: boolean } | null>(null);

  async function run(plan: PlanId, billing: Billing, cancel = false) {
    const action = planActionFor(current, plan);
    setBusy(true);
    const r = await withToast(() => api("/api/plan", "POST", { plan, billing }), {
      loading: cancel ? "Cancelling…" : action === "renew" ? "Renewing…" : "Updating plan…",
      success: cancel
        ? "Subscription cancelled. You're on the free plan"
        : action === "renew"
          ? `${PLANS[plan].name} renewed`
          : action === "upgrade"
            ? `Upgraded to ${PLANS[plan].name}`
            : `Switched to ${PLANS[plan].name}`,
      error: "Couldn't update your plan",
    });
    setBusy(false);
    setConfirm(null);
    if (r.ok) router.refresh();
  }

  /** Starts the right flow for a target plan. */
  function choose(plan: PlanId, billing: Billing) {
    const action = planActionFor(current, plan);
    if (action === "downgrade") setConfirm({ plan, billing, cancel: plan === "starter" });
    else void run(plan, billing);
  }

  const cancelSubscription = () => setConfirm({ plan: "starter", billing: "monthly", cancel: true });

  const dialog = (
    <Dialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {confirm?.cancel ? "Cancel your subscription?" : `Switch to ${confirm ? PLANS[confirm.plan].name : ""}?`}
          </DialogTitle>
          <DialogDescription>
            {confirm?.cancel
              ? "You'll move to the free Starter plan right away. Paid features like reports, extra charts and custom upgrades lock until you subscribe again. Your data is kept."
              : "Features that aren't part of the smaller plan lock right away. Your data is kept."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setConfirm(null)}>
            Keep my plan
          </Button>
          <Button
            variant="destructive"
            disabled={busy}
            onClick={() => confirm && run(confirm.plan, confirm.billing, confirm.cancel)}
          >
            {confirm?.cancel ? "Cancel subscription" : "Switch plan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return { choose, cancelSubscription, busy, dialog };
}
