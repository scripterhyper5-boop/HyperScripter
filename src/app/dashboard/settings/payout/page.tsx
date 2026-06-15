"use client";

import { PayoutSettingsForm, SettingsSubNav } from "@/components/account/payout-settings-form";

export default function PayoutSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure how you receive affiliate commission payouts
        </p>
      </div>

      <SettingsSubNav active="payout" />
      <PayoutSettingsForm />
    </div>
  );
}
