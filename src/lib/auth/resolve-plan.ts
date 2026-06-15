import type { PlanId } from "@/lib/plans";
import type { User } from "./types";

/**
 * Resolves the active plan for UI gating.
 * Only falls back to "free" when the user is missing or has no plan field.
 */
export function resolveUserPlan(user: User | null | undefined): PlanId {
  if (!user) return "free";
  if (user.plan === "free" || user.plan === "pro" || user.plan === "team") {
    return user.plan;
  }
  return "free";
}
