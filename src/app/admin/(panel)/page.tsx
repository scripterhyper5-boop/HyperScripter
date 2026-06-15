"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import {
  Users,
  UserCheck,
  FileText,
  Files,
  DollarSign,
  TrendingUp,
  Bot,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { AdminStatCard } from "@/components/admin/stat-card";
import { AdminDashboardSkeleton } from "@/components/admin/loading-skeleton";
import { StatusBadge } from "@/components/admin/status-badge";
import { DataEmpty, DataError } from "@/components/ui/data-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatAdminDate, formatCurrency } from "@/lib/admin/format";
import type {
  AdminAiStatus,
  AdminDashboardStats,
  AdminRecentActivity,
} from "@/lib/admin/types";

function DashboardContent() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [activity, setActivity] = useState<AdminRecentActivity[]>([]);
  const [aiStatus, setAiStatus] = useState<AdminAiStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/dashboard", { credentials: "include" });
      const data = (await res.json()) as {
        stats?: AdminDashboardStats;
        activity?: AdminRecentActivity[];
        aiStatus?: AdminAiStatus;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Failed to load dashboard");
      setStats(data.stats ?? null);
      setActivity(data.activity ?? []);
      setAiStatus(data.aiStatus ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  if (loading) return <AdminDashboardSkeleton />;
  if (error) return <DataError message={error} />;
  if (!stats) return <DataError message="Dashboard data unavailable" />;

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Dashboard"
        description="Overview of your HyperScripter platform"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <AdminStatCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          icon={Users}
        />
        <AdminStatCard
          title="Active Users"
          value={stats.activeUsers.toLocaleString()}
          icon={UserCheck}
        />
        <AdminStatCard
          title="Scripts Today"
          value={stats.scriptsToday.toLocaleString()}
          icon={FileText}
        />
        <AdminStatCard
          title="Total Scripts"
          value={stats.totalScripts.toLocaleString()}
          icon={Files}
        />
        <AdminStatCard
          title="Revenue"
          value={formatCurrency(stats.revenue)}
          icon={DollarSign}
        />
        <AdminStatCard
          title="MRR"
          value={formatCurrency(stats.mrr)}
          icon={TrendingUp}
        />
      </div>

      {aiStatus && (
        <section className="saas-card border border-border p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet/10 ring-1 ring-violet/20">
                <Bot className="h-4 w-4 text-violet" />
              </div>
              <div>
                <h2 className="text-base font-semibold">AI Status</h2>
                <p className="text-xs text-muted-foreground">
                  Script generation provider
                </p>
              </div>
            </div>
            <StatusBadge status={aiStatus.status} />
          </div>
          <dl className="mt-5 grid gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-xs text-muted-foreground">Provider</dt>
              <dd className="mt-1 text-sm font-medium capitalize">
                {aiStatus.provider}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Active Model</dt>
              <dd className="mt-1 font-mono text-sm">{aiStatus.model}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Last Updated</dt>
              <dd className="mt-1 text-sm text-muted-foreground">
                {aiStatus.updatedAt
                  ? formatAdminDate(aiStatus.updatedAt)
                  : "—"}
              </dd>
            </div>
          </dl>
        </section>
      )}

      <section className="saas-card overflow-hidden border border-border">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold">Recent Activity</h2>
        </div>
        {activity.length === 0 ? (
          <div className="p-6">
            <DataEmpty title="No activity yet" description="Platform activity will appear here" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activity.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.user}</TableCell>
                  <TableCell className="text-muted-foreground">{row.action}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatAdminDate(row.date)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={row.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<AdminDashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
