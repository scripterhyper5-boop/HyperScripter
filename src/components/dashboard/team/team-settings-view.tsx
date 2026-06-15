"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataError, DataLoading } from "@/components/ui/data-state";
import { TeamPageShell } from "@/components/dashboard/team/team-page-shell";
import { useTeamWorkspace } from "@/hooks/use-team-workspace";
import { formatTeamErrorDetails, updateTeamSettings } from "@/lib/api/team-client";
import { canManageWorkspaceSettings, roleLabel } from "@/lib/team/permissions";

export function TeamSettingsView() {
  const { workspace, role, loading, error, errorDetails, refresh } = useTeamWorkspace();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (workspace) setName(workspace.name);
  }, [workspace]);

  const canEdit = role ? canManageWorkspaceSettings(role) : false;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      await updateTeamSettings(name.trim());
      toast.success("Workspace settings saved");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <TeamPageShell title="Team Settings" description="Manage your workspace preferences">
        <DataLoading message="Loading settings..." />
      </TeamPageShell>
    );
  }

  if (error || !workspace) {
    return (
      <TeamPageShell title="Team Settings" description="Manage your workspace preferences">
        <DataError
          message={error ?? "Workspace not found"}
          details={formatTeamErrorDetails(errorDetails)}
        />
      </TeamPageShell>
    );
  }

  return (
    <TeamPageShell title="Team Settings" description="Manage your workspace preferences">
      <div className="max-w-xl space-y-6">
        <section className="saas-card rounded-xl p-5 sm:p-6">
          <h2 className="mb-4 text-base font-semibold">Workspace Details</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="workspace-name">Workspace Name</Label>
              <Input
                id="workspace-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!canEdit}
                required
              />
            </div>
            <div className="space-y-1 text-sm">
              <p className="text-muted-foreground">
                Slug: <span className="text-foreground">{workspace.slug}</span>
              </p>
              <p className="text-muted-foreground">
                Your role: <span className="text-foreground">{roleLabel(role!)}</span>
              </p>
            </div>
            {canEdit ? (
              <Button type="submit" variant="violet-glow" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground">
                Only the workspace owner can change settings.
              </p>
            )}
          </form>
        </section>
      </div>
    </TeamPageShell>
  );
}
