"use client";

import Link from "next/link";
import { ArrowRight, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardStats, getGreeting } from "@/components/dashboard/dashboard-stats";
import { PlanBadge } from "@/components/dashboard/plan-badge";
import { usePlan } from "@/hooks/use-plan";
import { isProWorkspaceNavAllowed } from "@/lib/plans/navigation";
import { PLANS } from "@/lib/plans";

export function DashboardOverview() {
  const { planId, nextPlan, allowance } = usePlan();
  const showScriptsNav = isProWorkspaceNavAllowed(planId);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <PlanBadge planId={planId} size="md" />
            {planId === "team" && (
              <span className="inline-flex items-center gap-1 rounded-md border border-cyan/20 bg-cyan/10 px-2 py-0.5 text-[10px] font-medium text-cyan">
                <Sparkles className="h-3 w-3" />
                Priority generation
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {getGreeting()} 👋
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground sm:text-base">
            {planId === "free"
              ? "You're on Free — 5 scripts per month. Upgrade for exports and more."
              : planId === "pro"
                ? "Pro unlocked — exports, advanced preferences, and commercial use."
                : "Team workspace active — priority generation and shared library enabled."}
          </p>
        </div>
        <Button variant="violet-glow" size="lg" asChild className="shrink-0">
          <Link href="/dashboard/generate">
            <Plus className="h-4 w-4" />
            New Script
          </Link>
        </Button>
      </div>

      {nextPlan && !allowance.unlimited && allowance.remaining !== null && allowance.remaining <= 2 && (
        <div className="rounded-xl border border-violet/20 bg-violet/5 p-4">
          <p className="text-sm font-medium">
            {allowance.remaining === 0
              ? "You've used all scripts this month."
              : `Only ${allowance.remaining} script${allowance.remaining === 1 ? "" : "s"} left this month.`}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Upgrade to {nextPlan === "pro" ? "Pro" : "Team"} for {PLANS[nextPlan].monthlyLimitLabel.toLowerCase()}.
          </p>
          <Button variant="violet-glow" size="sm" className="mt-3" asChild>
            <Link href="/dashboard/billing">View plans</Link>
          </Button>
        </div>
      )}

      <DashboardStats />

      <section className="saas-card p-6">
        <h2 className="text-base font-semibold">Quick start</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Jump back in — generate a script or review your recent work.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button variant="violet-glow" asChild>
            <Link href="/dashboard/generate">
              Generate Script
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          {showScriptsNav && (
            <Button variant="outline" asChild>
              <Link href="/dashboard/scripts">View Scripts</Link>
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}
