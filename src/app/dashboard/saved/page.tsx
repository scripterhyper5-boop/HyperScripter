import Link from "next/link";
import { Bookmark, Plus } from "lucide-react";
import { PlanRouteGuard } from "@/components/dashboard/plan-route-guard";
import { Button } from "@/components/ui/button";

function SavedScriptsContent() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Saved Scripts</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Scripts you&apos;ve bookmarked for later
        </p>
      </div>

      <div className="dashboard-card flex flex-col items-center justify-center rounded-xl py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet/10 ring-1 ring-violet/20">
          <Bookmark className="h-5 w-5 text-violet" />
        </div>
        <h2 className="mt-4 text-sm font-medium">No saved scripts yet</h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Save scripts from your history to access them quickly here.
        </p>
        <Button variant="violet-glow" className="mt-6" asChild>
          <Link href="/dashboard/generate">
            <Plus className="h-4 w-4" />
            Generate Script
          </Link>
        </Button>
      </div>
    </div>
  );
}

export default function SavedScriptsPage() {
  return (
    <PlanRouteGuard
      requiredPlan="pro"
      title="Upgrade to Pro"
      description="Saved scripts and search are available on Pro and Team plans."
    >
      <SavedScriptsContent />
    </PlanRouteGuard>
  );
}
