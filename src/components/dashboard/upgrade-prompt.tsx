import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PlanFeature } from "@/lib/plans";
import { usePlan } from "@/hooks/use-plan";

interface UpgradePromptProps {
  feature: PlanFeature;
  className?: string;
  compact?: boolean;
}

export function UpgradePrompt({ feature, className, compact = false }: UpgradePromptProps) {
  const { hasFeature, upgradeLabel, nextPlan } = usePlan();
  const label = upgradeLabel(feature);

  if (!label || hasFeature(feature)) return null;

  const targetPlan = label.includes("Team") ? "Team" : "Pro";

  if (compact) {
    return (
      <p className={cn("flex items-center gap-1.5 text-xs text-muted-foreground", className)}>
        <Lock className="h-3 w-3 shrink-0" aria-hidden="true" />
        <span>{label}</span>
      </p>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-white/[0.02] p-4",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-50 ring-1 ring-border">
          <Lock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{label}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Upgrade to {targetPlan} to unlock this feature.
          </p>
          {nextPlan && (
            <Button variant="violet-glow" size="sm" className="mt-3" asChild>
              <Link href="/dashboard/billing">Upgrade to {targetPlan}</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

interface FeatureGateProps {
  feature: PlanFeature;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

export function FeatureGate({ feature, children, fallback, className }: FeatureGateProps) {
  const { hasFeature } = usePlan();

  if (hasFeature(feature)) {
    return <>{children}</>;
  }

  return (
    <div className={className}>
      {fallback ?? <UpgradePrompt feature={feature} />}
    </div>
  );
}

interface LockedLabelProps {
  feature: PlanFeature;
  className?: string;
}

/** Inline lock label: "🔒 Available on Pro" */
export function LockedLabel({ feature, className }: LockedLabelProps) {
  const { hasFeature, upgradeLabel } = usePlan();
  const label = upgradeLabel(feature);

  if (!label || hasFeature(feature)) return null;

  return (
    <span className={cn("inline-flex items-center gap-1 text-xs text-muted-foreground", className)}>
      <Lock className="h-3 w-3" aria-hidden="true" />
      {label}
    </span>
  );
}
