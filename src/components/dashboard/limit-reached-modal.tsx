"use client";

import Link from "next/link";
import { X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLANS, type PlanId } from "@/lib/plans";

interface LimitReachedModalProps {
  open: boolean;
  onClose: () => void;
  currentPlan: PlanId;
  nextPlan: PlanId | null;
}

export function LimitReachedModal({
  open,
  onClose,
  currentPlan,
  nextPlan,
}: LimitReachedModalProps) {
  if (!open || !nextPlan) return null;

  const target = PLANS[nextPlan];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-gray-900/20 p-4 sm:items-center">
      <div
        className="saas-card w-full max-w-md rounded-2xl p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="limit-reached-title"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 id="limit-reached-title" className="text-lg font-semibold">
              Monthly limit reached
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              You&apos;ve used all {PLANS[currentPlan].monthlyScriptLimit} scripts on
              your {PLANS[currentPlan].name} plan this month.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-gray-50 hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="rounded-xl border border-border bg-white/[0.02] p-4">
          <p className="text-sm font-medium">Upgrade to {target.name}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {target.monthlyLimitLabel} · {target.enabledFeatures.slice(0, 3).join(" · ")}
          </p>
          <p className="mt-3 text-2xl font-bold">
            {target.priceLabel}
            <span className="text-sm font-normal text-muted-foreground">
              {target.periodLabel}
            </span>
          </p>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose}>
            Not now
          </Button>
          <Button variant="violet-glow" asChild>
            <Link href="/dashboard/billing">
              <Sparkles className="h-4 w-4" />
              Upgrade to {target.name}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
