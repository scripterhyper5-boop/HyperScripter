import type { User } from "@/lib/auth/types";

export type PlanId = User["plan"];

export type PlanFeature =
  | "allScriptTypes"
  | "allTonesHooks"
  | "saveScripts"
  | "copyToClipboard"
  | "exportTxt"
  | "exportDocx"
  | "advancedPreferences"
  | "commercialUse"
  | "saveAndSearchScripts"
  | "priorityGeneration"
  | "teamWorkspace"
  | "teamMembers"
  | "teamAnalytics"
  | "sharedScriptLibrary";

export interface PlanDefinition {
  id: PlanId;
  name: string;
  price: number;
  priceLabel: string;
  periodLabel: string;
  description: string;
  monthlyScriptLimit: number | null;
  monthlyLimitLabel: string;
  highlighted: boolean;
  cta: string;
  href: string;
  enabledFeatures: string[];
  disabledFeatures: string[];
}

const PLAN_ORDER: Record<PlanId, number> = {
  free: 0,
  pro: 1,
  team: 2,
};

/** Minimum plan required for each gated feature */
export const FEATURE_MIN_PLAN: Record<
  Exclude<
    PlanFeature,
    "allScriptTypes" | "allTonesHooks" | "saveScripts" | "copyToClipboard"
  >,
  Exclude<PlanId, "free">
> = {
  exportTxt: "pro",
  exportDocx: "pro",
  advancedPreferences: "pro",
  commercialUse: "pro",
  saveAndSearchScripts: "pro",
  priorityGeneration: "team",
  teamWorkspace: "team",
  teamMembers: "team",
  teamAnalytics: "team",
  sharedScriptLibrary: "team",
};

export const PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: "free",
    name: "Free",
    price: 0,
    priceLabel: "$0",
    periodLabel: "Forever",
    description: "Perfect for getting started",
    monthlyScriptLimit: 5,
    monthlyLimitLabel: "5 scripts per month",
    highlighted: false,
    cta: "Get started",
    href: "/signup",
    enabledFeatures: [
      "5 scripts per month",
      "All TikTok script types",
      "All tones & hooks",
      "Save scripts",
      "Copy to clipboard",
    ],
    disabledFeatures: [
      "Export to TXT",
      "Export to DOCX",
      "Advanced preferences",
      "Priority generation",
      "Commercial use",
      "Team workspace",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 19,
    priceLabel: "$19",
    periodLabel: "/month",
    description: "For serious creators",
    monthlyScriptLimit: 100,
    monthlyLimitLabel: "100 scripts per month",
    highlighted: true,
    cta: "Start Pro",
    href: "/signup",
    enabledFeatures: [
      "100 scripts per month",
      "All TikTok script types",
      "All tones & hooks",
      "Save & search scripts",
      "Export to TXT",
      "Export to DOCX",
      "Advanced preferences",
      "Commercial use",
    ],
    disabledFeatures: [
      "Team workspace",
      "Team members",
      "Team analytics",
    ],
  },
  team: {
    id: "team",
    name: "Team",
    price: 49,
    priceLabel: "$49",
    periodLabel: "/month",
    description: "For agencies & teams",
    monthlyScriptLimit: 500,
    monthlyLimitLabel: "500 scripts per month",
    highlighted: false,
    cta: "Start Team",
    href: "/signup",
    enabledFeatures: [
      "500 scripts per month",
      "Everything in Pro",
      "Priority generation",
      "Team workspace",
      "Team members",
      "Team analytics",
      "Shared script library",
    ],
    disabledFeatures: [],
  },
};

export const PLAN_LIST: PlanDefinition[] = [PLANS.free, PLANS.pro, PLANS.team];

export function planMeetsRequirement(
  planId: PlanId,
  required: Exclude<PlanId, "free">
): boolean {
  return PLAN_ORDER[planId] >= PLAN_ORDER[required];
}

export function planHasFeature(planId: PlanId, feature: PlanFeature): boolean {
  if (
    feature === "allScriptTypes" ||
    feature === "allTonesHooks" ||
    feature === "saveScripts" ||
    feature === "copyToClipboard"
  ) {
    return true;
  }

  const minPlan = FEATURE_MIN_PLAN[feature];
  return PLAN_ORDER[planId] >= PLAN_ORDER[minPlan];
}

export function getRequiredPlan(feature: PlanFeature): Exclude<PlanId, "free"> | null {
  if (
    feature === "allScriptTypes" ||
    feature === "allTonesHooks" ||
    feature === "saveScripts" ||
    feature === "copyToClipboard"
  ) {
    return null;
  }
  return FEATURE_MIN_PLAN[feature];
}

export function getUpgradeLabel(feature: PlanFeature): string | null {
  const required = getRequiredPlan(feature);
  if (!required) return null;
  if (required === "pro") return "Available on Pro";
  return "Available on Team";
}

export function getNextPlan(planId: PlanId): PlanId | null {
  if (planId === "free") return "pro";
  if (planId === "pro") return "team";
  return null;
}

export function formatPlanName(planId: PlanId): string {
  return PLANS[planId].name;
}

export function getPlanPriceLabel(planId: PlanId): string {
  const plan = PLANS[planId];
  if (plan.price === 0) return `${plan.priceLabel} ${plan.periodLabel}`;
  return `${plan.priceLabel}${plan.periodLabel}`;
}
