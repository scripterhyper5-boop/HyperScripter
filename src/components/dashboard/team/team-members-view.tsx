"use client";

import { useState } from "react";
import { Loader2, MoreHorizontal, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataEmpty, DataError, DataLoading } from "@/components/ui/data-state";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TeamPageShell } from "@/components/dashboard/team/team-page-shell";
import { useTeamMembers } from "@/hooks/use-team-members";
import {
  formatTeamErrorDetails,
  inviteTeamMember,
  removeTeamMember,
  updateTeamMemberRole,
} from "@/lib/api/team-client";
import { formatDate } from "@/lib/team/format";
import {
  canChangeMemberRole,
  canManageMembers,
  canRemoveMember,
  roleLabel,
} from "@/lib/team/permissions";
import type { WorkspaceRole } from "@/lib/team/types";

export function TeamMembersView() {
  const {
    workspace,
    owner,
    members,
    invitations,
    role,
    loading,
    initializing,
    error,
    errorDetails,
    refresh,
  } = useTeamMembers();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<WorkspaceRole>("member");
  const [inviting, setInviting] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const canManage = role ? canManageMembers(role) : false;
  const pageTitle = workspace?.name ? `${workspace.name} — Members` : "Members";

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setInviting(true);
    try {
      const result = await inviteTeamMember(inviteEmail.trim(), inviteRole);
      toast.success(`Invitation sent to ${inviteEmail}`);
      if (result.invitation.acceptUrl) {
        await navigator.clipboard.writeText(result.invitation.acceptUrl);
        toast.message("Invite link copied to clipboard");
      }
      setInviteEmail("");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send invitation");
    } finally {
      setInviting(false);
    }
  }

  async function handleRoleChange(memberId: string, newRole: WorkspaceRole) {
    setActionId(memberId);
    try {
      await updateTeamMemberRole(memberId, newRole);
      toast.success("Role updated");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setActionId(null);
    }
  }

  async function handleRemove(memberId: string, name: string) {
    if (!window.confirm(`Remove ${name} from the workspace?`)) return;

    setActionId(memberId);
    try {
      await removeTeamMember(memberId);
      toast.success("Member removed");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove member");
    } finally {
      setActionId(null);
    }
  }

  if (loading || initializing) {
    return (
      <TeamPageShell title={pageTitle} description="Manage your team members and invitations">
        <DataLoading
          message={initializing ? "Creating your workspace..." : "Loading members..."}
        />
      </TeamPageShell>
    );
  }

  if (error) {
    return (
      <TeamPageShell title={pageTitle} description="Manage your team members and invitations">
        <DataError message={error} details={formatTeamErrorDetails(errorDetails)} />
      </TeamPageShell>
    );
  }

  return (
    <TeamPageShell title={pageTitle} description="Manage your team members and invitations">
      <div className="space-y-6">
        {owner && (
          <p className="text-sm text-muted-foreground">
            Workspace owner: <span className="text-foreground">{owner.name}</span> (
            {owner.email})
          </p>
        )}

        {canManage && (
          <section className="saas-card rounded-xl p-5 sm:p-6">
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">
              <UserPlus className="h-4 w-4 text-violet" />
              Invite Member
            </h2>
            <form onSubmit={handleInvite} className="grid gap-4 sm:grid-cols-[1fr_auto_auto]">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="teammate@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={inviteRole}
                  onValueChange={(v) => setInviteRole(v as WorkspaceRole)}
                >
                  <SelectTrigger className="w-full sm:w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  type="submit"
                  variant="violet-glow"
                  disabled={inviting}
                  className="w-full sm:w-auto"
                >
                  {inviting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Invite"
                  )}
                </Button>
              </div>
            </form>
          </section>
        )}

        <section className="saas-card overflow-hidden rounded-xl">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-base font-semibold">Members ({members.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Member</TableHead>
                  <TableHead className="hidden sm:table-cell">Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="hidden md:table-cell">Joined</TableHead>
                  {canManage && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={canManage ? 5 : 4}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No members yet
                    </TableCell>
                  </TableRow>
                ) : (
                  members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet/30 to-cyan/20 text-[10px] font-semibold ring-1 ring-border">
                            {member.initials}
                          </div>
                          <span className="font-medium">{member.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground sm:table-cell">
                        {member.email}
                      </TableCell>
                      <TableCell>
                        {canManage &&
                        role &&
                        canChangeMemberRole(role, member.role) ? (
                          <Select
                            value={member.role}
                            onValueChange={(v) =>
                              void handleRoleChange(member.id, v as WorkspaceRole)
                            }
                            disabled={actionId === member.id}
                          >
                            <SelectTrigger className="h-8 w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="member">Member</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant="muted" className="font-normal">
                            {roleLabel(member.role)}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">
                        {formatDate(member.joinedAt)}
                      </TableCell>
                      {canManage && (
                        <TableCell className="text-right">
                          {role &&
                            canRemoveMember(role, member.role) && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    disabled={actionId === member.id}
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    className="text-red-600 focus:text-red-600"
                                    onClick={() =>
                                      void handleRemove(member.id, member.name)
                                    }
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Remove member
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </section>

        <section className="saas-card overflow-hidden rounded-xl">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-base font-semibold">
              Pending Invitations ({invitations.length})
            </h2>
          </div>
          {invitations.length === 0 ? (
            <DataEmpty
              title="No invitations yet"
              description="Invite teammates to join your workspace."
              className="border-0"
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Expires</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitations.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell>{inv.email}</TableCell>
                      <TableCell>
                        <Badge variant="muted" className="font-normal">
                          {roleLabel(inv.role)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(inv.expiresAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>
      </div>
    </TeamPageShell>
  );
}
