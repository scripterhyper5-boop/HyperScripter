"use client";

import { AccountSettingsPanel } from "@/components/account/account-settings-panel";
import { SettingsSubNav } from "@/components/account/payout-settings-form";
import { SessionManagement } from "@/components/account/session-management";
import { PlanBadge } from "@/components/dashboard/plan-badge";
import { useAuth } from "@/components/providers/auth-provider";
import { usePlan } from "@/hooks/use-plan";

export default function SettingsPage() {
  const { refresh } = useAuth();
  const { planId } = usePlan();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Account settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your profile, email, and password
          </p>
        </div>
        <PlanBadge planId={planId} size="md" />
      </div>

      <SettingsSubNav active="account" />

      <AccountSettingsPanel
        variant="user"
        profileApiUrl="/api/account/profile"
        passwordApiUrl="/api/account/password"
        onProfileSaved={() => refresh()}
      />

      <SessionManagement />
    </div>
  );
}
