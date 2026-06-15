"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { AccountSettingsPanel } from "@/components/account/account-settings-panel";
import { SessionManagement } from "@/components/account/session-management";
import { useAdminAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";

export default function AdminAccountSettingsPage() {
  const { refresh } = useAdminAuth();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Account"
        description="Manage your admin profile and credentials"
      >
        <Button variant="outline" size="sm" className="border-border" asChild>
          <Link href="/admin/platform">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Platform settings
          </Link>
        </Button>
      </AdminPageHeader>

      <AccountSettingsPanel
        variant="admin"
        profileApiUrl="/api/admin/account/profile"
        passwordApiUrl="/api/admin/account/password"
        onProfileSaved={() => refresh()}
      />

      <SessionManagement />
    </div>
  );
}
