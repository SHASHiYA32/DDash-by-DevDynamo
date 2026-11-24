export type PlanId = "starter" | "growth" | "scale";

export type FeatureKey =
  | "advancedCharts"
  | "reports"
  | "csvExport"
  | "autoWeekly"
  | "autoMonthly"
  | "customRange"
  | "customTabs";

export interface Plan {
  id: PlanId;
  name: string;
  tagline: string;
  priceMonthly: number;
  maxMembers: number; // Infinity = unlimited
  /** Custom upgrades (built by the developers) included in the plan. */
  customUpgrades: number;
  features: Record<FeatureKey, boolean>;
  highlights: string[];
  popular?: boolean;
}

export const PLANS: Record<PlanId, Plan> = {
  starter: {
    id: "starter",
    name: "Starter",
    tagline: "For solo owners getting organised.",
    priceMonthly: 0,
    maxMembers: 3,
    customUpgrades: 0,
    features: {
      advancedCharts: false,
      reports: false,
      csvExport: false,
      autoWeekly: false,
      autoMonthly: false,
      customRange: false,
      customTabs: false,
    },
    highlights: [
      "Up to 3 team members",
      "Income & expense tracking",
      "Live revenue chart",
      "Employee login portal",
      "Light & dark mode",
    ],
  },
  growth: {
    id: "growth",
    name: "Growth",
    tagline: "For growing teams who need clarity.",
    priceMonthly: 19,
    maxMembers: 15,
    customUpgrades: 3,
    popular: true,
    features: {
      advancedCharts: true,
      reports: true,
      csvExport: true,
      autoWeekly: true,
      autoMonthly: false,
      customRange: false,
      customTabs: true,
    },
    highlights: [
      "Up to 15 team members",
      "All animated charts",
      "Report generation (print / PDF)",
      "Automatic weekly reports",
      "CSV export",
      "3 custom upgrades built by our developers",
    ],
  },
  scale: {
    id: "scale",
    name: "Scale",
    tagline: "For established businesses.",
    priceMonthly: 49,
    maxMembers: Infinity,
    customUpgrades: 5,
    features: {
      advancedCharts: true,
      reports: true,
      csvExport: true,
      autoWeekly: true,
      autoMonthly: true,
      customRange: true,
      customTabs: true,
    },
    highlights: [
      "Unlimited team members",
      "Weekly + monthly automatic reports",
      "Custom date-range reports",
      "5 custom upgrades built by our developers",
      "Everything in Growth",
      "Priority support",
    ],
  },
};

export const PLAN_ORDER: PlanId[] = ["starter", "growth", "scale"];

export function planHas(plan: PlanId, feature: FeatureKey) {
  return PLANS[plan].features[feature];
}

export function memberLimit(plan: PlanId) {
  return PLANS[plan].maxMembers;
}

export function annualMonthly(plan: Plan) {
  return Math.round(plan.priceMonthly * 0.8 * 100) / 100;
}

export const FEATURE_LABELS: Record<FeatureKey, string> = {
  advancedCharts: "All animated charts",
  reports: "Report generation",
  csvExport: "CSV export",
  autoWeekly: "Automatic weekly reports",
  autoMonthly: "Automatic monthly reports",
  customRange: "Custom date-range reports",
  customTabs: "Custom upgrades",
};

export function minPlanFor(feature: FeatureKey): PlanId {
  return PLAN_ORDER.find((p) => PLANS[p].features[feature]) ?? "scale";
}

export function planRank(plan: PlanId) {
  return PLAN_ORDER.indexOf(plan);
}

export type PlanAction = "current" | "renew" | "upgrade" | "downgrade" | "start";

/** What the pricing button should say for someone who is on `current`. */
export function planActionFor(current: PlanId, target: PlanId): PlanAction {
  if (current === target) return target === "starter" ? "current" : "renew";
  return planRank(target) > planRank(current) ? "upgrade" : "downgrade";
}

export function customAllowance(plan: PlanId) {
  return PLANS[plan].customUpgrades;
}
