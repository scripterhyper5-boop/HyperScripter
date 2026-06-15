"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { PlanRouteGuard } from "@/components/dashboard/plan-route-guard";
import { ScriptHistory } from "@/components/dashboard/script-history";
import { Button } from "@/components/ui/button";

function ScriptsContent() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Scripts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your generated TikTok scripts
          </p>
        </div>
        <Button variant="violet-glow" size="sm" asChild>
          <Link href="/dashboard/generate">
            <Plus className="h-4 w-4" />
            New Script
          </Link>
        </Button>
      </div>

      <ScriptHistory />
    </div>
  );
}

export default function ScriptsPage() {
  return (
    <PlanRouteGuard
      requiredPlan="pro"
      title="Upgrade to Pro"
      description="Script history and saved scripts are available on Pro and Team plans."
    >
      <ScriptsContent />
    </PlanRouteGuard>
  );
}
