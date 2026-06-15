"use client";

import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLANS, type PlanId } from "@/lib/plans";
import { cn } from "@/lib/utils";

interface PlanUpgradeScreenProps {
  targetPlan: Exclude<PlanId, "free">;
  title?: string;
  description?: string;
  className?: string;
}

export function PlanUpgradeScreen({
  targetPlan,
  title,
  description,
  className,
}: PlanUpgradeScreenProps) {
  const plan = PLANS[targetPlan];
  const heading = title ?? `Upgrade to ${plan.name}`;
  const body =
    description ??
    (targetPlan === "pro"
      ? "Unlock script history, saved scripts, exports, and advanced creator tools."
      : "Unlock team workspace, shared library, analytics, and priority generation.");

  return (
    <div
      className={cn(
        "flex min-h-[50vh] flex-col items-center justify-center px-4 py-12 text-center",
        className
      )}
    >
      <div className="saas-card w-full max-w-md rounded-2xl p-8">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-violet/15 ring-1 ring-violet/25">
          <Lock className="h-5 w-5 text-violet" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-bold tracking-tight">{heading}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{body}</p>
        <p className="mt-4 text-2xl font-bold">
          {plan.priceLabel}
          <span className="text-sm font-normal text-muted-foreground">
            {plan.periodLabel}
          </span>
        </p>
        <Button variant="violet-glow" size="lg" className="mt-6 w-full" asChild>
          <Link href="/dashboard/billing">
            <Sparkles className="h-4 w-4" />
            Upgrade to {plan.name}
          </Link>
        </Button>
      </div>
    </div>
  );
}
