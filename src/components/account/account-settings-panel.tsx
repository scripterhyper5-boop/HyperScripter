"use client";

import { ProfileSettingsForm } from "@/components/account/profile-settings-form";
import { ChangePasswordForm } from "@/components/account/change-password-form";
import type { AccountProfileResponse } from "@/lib/account/types";

interface AccountSettingsPanelProps {
  variant: "user" | "admin";
  profileApiUrl: string;
  passwordApiUrl: string;
  onProfileSaved?: (profile: AccountProfileResponse) => void;
}

export function AccountSettingsPanel({
  variant,
  profileApiUrl,
  passwordApiUrl,
  onProfileSaved,
}: AccountSettingsPanelProps) {
  return (
    <div className="space-y-6">
      <ProfileSettingsForm
        variant={variant}
        profileApiUrl={profileApiUrl}
        onSaved={onProfileSaved}
      />
      <ChangePasswordForm variant={variant} passwordApiUrl={passwordApiUrl} />
    </div>
  );
}
