"use client";

import Link from "next/link";
import { BarChart3, Crown, FileText, Settings, UserPlus, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataEmpty, DataError, DataLoading } from "@/components/ui/data-state";
import { TeamPageShell } from "@/components/dashboard/team/team-page-shell";
import { useTeamWorkspace } from "@/hooks/use-team-workspace";
import { formatTeamErrorDetails } from "@/lib/api/team-client";
import { canManageMembers, roleLabel } from "@/lib/team/permissions";
import { cn } from "@/lib/utils";

export function TeamWorkspaceView() {
  const {
    workspace,
    owner,
    role,
    members,
    memberCount,
    analytics,
    loading,
    initializing,
    error,
    errorDetails,
  } = useTeamWorkspace();

  if (loading || initializing) {
    return (
      <TeamPageShell
        title="Team Workspace"
        description="Collaborate with your team in a shared workspace"
      >
        <DataLoading
          message={
            initializing
              ? "Creating your workspace..."
              : "Loading workspace..."
          }
        />
      </TeamPageShell>
    );
  }

  if (error || !workspace) {
    return (
      <TeamPageShell
        title="Team Workspace"
        description="Collaborate with your team in a shared workspace"
      >
        <DataError
          message={error ?? "Workspace is being prepared."}
          details={formatTeamErrorDetails(errorDetails)}
        />
      </TeamPageShell>
    );
  }

  const canInvite = role ? canManageMembers(role) : false;
  const teamScriptsCount = analytics?.scriptsGenerated ?? 0;
  const totalMembers = analytics?.totalMembers ?? memberCount ?? members.length;

  const stats = [
    {
      label: "Total Members",
      value: String(totalMembers),
      icon: Users,
      accent: "violet" as const,
    },
    {
      label: "Team Scripts",
      value: String(teamScriptsCount),
      icon: FileText,
      accent: "cyan" as const,
    },
    {
      label: "Scripts This Month",
      value: String(analytics?.scriptsThisMonth ?? 0),
      icon: BarChart3,
      accent: "violet" as const,
    },
    {
      label: "Most Active Member",
      value: analytics?.mostActiveMember?.name ?? "—",
      sub: analytics?.mostActiveMember
        ? `${analytics.mostActiveMember.count} scripts`
        : "No activity yet",
      icon: UserPlus,
      accent: "cyan" as const,
    },
  ];

  return (
    <TeamPageShell
      title={workspace.name}
      description="Collaborate with your team in a shared workspace"
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="muted" className="font-normal">
              Your role: {roleLabel(role!)}
            </Badge>
            {owner && (
              <Badge variant="muted" className="gap-1 font-normal">
                <Crown className="h-3 w-3 text-amber-600" />
                Owner: {owner.name}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              Created {new Date(workspace.createdAt).toLocaleDateString()}
            </span>
          </div>
          {canInvite && (
            <Button variant="violet-glow" size="sm" className="gap-1.5" asChild>
              <Link href="/dashboard/team/members">
                <UserPlus className="h-4 w-4" />
                Invite Member
              </Link>
            </Button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <article
              key={stat.label}
              className="saas-card rounded-xl p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="mt-1 truncate text-2xl font-bold tracking-tight">
                    {stat.value}
                  </p>
                  {"sub" in stat && stat.sub && (
                    <p className="mt-1 text-xs text-muted-foreground">{stat.sub}</p>
                  )}
                </div>
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1",
                    stat.accent === "violet"
                      ? "bg-violet/10 ring-violet/20"
                      : "bg-cyan/10 ring-cyan/20"
                  )}
                >
                  <stat.icon
                    className={cn(
                      "h-4 w-4",
                      stat.accent === "violet" ? "text-violet" : "text-cyan"
                    )}
                  />
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="saas-card rounded-xl p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-violet" />
                <h2 className="text-base font-semibold">
                  Team Members ({totalMembers})
                </h2>
              </div>
              {canInvite && (
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" asChild>
                  <Link href="/dashboard/team/members">
                    <UserPlus className="h-3.5 w-3.5" />
                    Invite
                  </Link>
                </Button>
              )}
            </div>
            {members.length === 0 ? (
              <DataEmpty
                title="No members yet"
                description="Invite teammates to start collaborating."
              />
            ) : (
              <ul className="space-y-3">
                {members.slice(0, 5).map((member) => (
                  <li
                    key={member.id}
                    className="flex items-center gap-3 rounded-lg border border-border bg-white/[0.02] p-3"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet/30 to-cyan/20 text-xs font-semibold ring-1 ring-border">
                      {member.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium">{member.name}</p>
                        <Badge variant="muted" className="text-[10px] font-normal">
                          {roleLabel(member.role)}
                        </Badge>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {member.email}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="saas-card rounded-xl p-5 sm:p-6">
            <h2 className="mb-5 text-base font-semibold">Quick Links</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                {
                  href: "/dashboard/team/members",
                  label: "Members",
                  desc: `${totalMembers} team members`,
                  icon: Users,
                },
                {
                  href: "/dashboard/team/scripts",
                  label: "Team Scripts",
                  desc: `${teamScriptsCount} scripts from your team`,
                  icon: FileText,
                },
                {
                  href: "/dashboard/team/settings",
                  label: "Settings",
                  desc: "Workspace preferences",
                  icon: Settings,
                },
                {
                  href: "/dashboard/generate",
                  label: "Generate",
                  desc: "Create a new script",
                  icon: BarChart3,
                },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-xl border border-border bg-white/[0.02] p-4 transition-all hover:border-gray-300 hover:bg-gray-50"
                >
                  <link.icon className="mb-2 h-4 w-4 text-violet" />
                  <p className="font-medium">{link.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{link.desc}</p>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </TeamPageShell>
  );
}
