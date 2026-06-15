"use client";

import { usePlan } from "@/hooks/use-plan";
import {
  FileText,
  Sparkles,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PlanBadge } from "@/components/dashboard/plan-badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface DashboardStatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  accent?: "violet" | "indigo";
  className?: string;
  footer?: React.ReactNode;
}

export function DashboardStatCard({
  title,
  value,
  icon: Icon,
  accent = "violet",
  className,
  footer,
}: DashboardStatCardProps) {
  return (
    <article
      className={cn(
        "saas-card-hover p-6",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900">{value}</p>
          {footer}
        </div>
        <div
          className={cn(
            accent === "violet" ? "kpi-icon-violet" : "kpi-icon-indigo"
          )}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
    </article>
  );
}

export function DashboardStats() {
  const { planId, plan, allowance, nextPlan, usageLoading } = usePlan();

  const scriptsUsedDisplay = allowance.unlimited
    ? `${allowance.used} used`
    : `${allowance.used} / ${allowance.limit} used`;

  const scriptsRemainingDisplay = allowance.unlimited
    ? "Unlimited"
    : String(allowance.remaining ?? 0);

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <DashboardStatCard
        title="Scripts Used"
        value={usageLoading ? "—" : scriptsUsedDisplay}
        icon={FileText}
        accent="violet"
      />
      <DashboardStatCard
        title="Scripts Remaining"
        value={usageLoading ? "—" : scriptsRemainingDisplay}
        icon={Sparkles}
        accent="indigo"
      />
      <DashboardStatCard
        title="Plan"
        value={plan.name}
        icon={CreditCard}
        accent="violet"
        footer={
          <div className="mt-3 space-y-2">
            <PlanBadge planId={planId} />
            {nextPlan &&
              !allowance.unlimited &&
              allowance.remaining !== null &&
              allowance.remaining <= 1 && (
                <Button variant="link" size="sm" className="h-auto p-0 text-xs" asChild>
                  <Link href="/dashboard/billing">Upgrade plan →</Link>
                </Button>
              )}
          </div>
        }
      />
    </div>
  );
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
