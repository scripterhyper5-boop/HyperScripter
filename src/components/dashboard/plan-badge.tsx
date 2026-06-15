import { cn } from "@/lib/utils";
import type { PlanId } from "@/lib/plans";
import { formatPlanName } from "@/lib/plans";

const planStyles: Record<PlanId, string> = {
  free: "border-border bg-gray-50 text-muted-foreground",
  pro: "border-violet/30 bg-violet/10 text-violet",
  team: "border-cyan/30 bg-cyan/10 text-cyan",
};

interface PlanBadgeProps {
  planId: PlanId;
  className?: string;
  size?: "sm" | "md";
}

export function PlanBadge({ planId, className, size = "sm" }: PlanBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border font-medium capitalize",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        planStyles[planId],
        className
      )}
    >
      {formatPlanName(planId)}
    </span>
  );
}
