import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FEATURE_LABELS, minPlanFor, PLANS, type FeatureKey } from "@/lib/plans";
import { cn } from "@/lib/utils";

export function UpgradeCard({
  feature,
  canUpgrade,
  className,
}: {
  feature: FeatureKey;
  canUpgrade: boolean;
  className?: string;
}) {
  const plan = PLANS[minPlanFor(feature)];
  return (
    <Card
      className={cn(
        "flex flex-col items-center justify-center gap-3 border-dashed p-8 text-center",
        className,
      )}
    >
      <span className="grid size-10 place-items-center rounded-full bg-secondary">
        <Lock className="size-4" />
      </span>
      <div>
        <div className="font-medium">{FEATURE_LABELS[feature]}</div>
        <p className="mt-1 text-sm text-muted-foreground">
          Available on the {plan.name} plan and higher.
        </p>
      </div>
      {canUpgrade ? (
        <Button asChild size="sm" variant="brand">
          <Link href="/dashboard/settings#plan">Upgrade to {plan.name}</Link>
        </Button>
      ) : (
        <p className="text-xs text-muted-foreground">Ask your business owner to upgrade.</p>
      )}
    </Card>
  );
}
