"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/page-header";
import {
  UserGrowthChart,
  ScriptTrendChart,
  SubscriptionsChart,
} from "@/components/admin/charts";
import { DataEmpty, DataError, DataLoading } from "@/components/ui/data-state";
import type { AdminAnalyticsData } from "@/lib/admin/types";

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AdminAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/analytics", { credentials: "include" });
      const data = (await res.json()) as {
        analytics?: AdminAnalyticsData;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Failed to load analytics");
      setAnalytics(data.analytics ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  if (loading) return <DataLoading message="Loading analytics..." />;
  if (error) return <DataError message={error} />;
  if (!analytics) return <DataError message="Analytics data unavailable" />;

  const subscriptionTotal = analytics.subscriptions.reduce(
    (sum, item) => sum + item.value,
    0
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Analytics"
        description="Platform growth and usage insights"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="saas-card border border-border p-6">
          <h2 className="mb-4 text-base font-semibold">User Growth</h2>
          <UserGrowthChart data={analytics.userGrowth} />
        </section>

        <section className="saas-card border border-border p-6">
          <h2 className="mb-4 text-base font-semibold">Script Generation Trend</h2>
          <ScriptTrendChart data={analytics.scriptTrend} />
        </section>

        <section className="saas-card border border-border p-6 lg:col-span-2">
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h2 className="mb-4 text-base font-semibold">Active Subscriptions</h2>
              <SubscriptionsChart data={analytics.subscriptions} />
            </div>
            <div className="flex flex-col justify-center space-y-3">
              {subscriptionTotal === 0 ? (
                <DataEmpty
                  title="No subscriptions yet"
                  description="Active subscription counts will appear here"
                />
              ) : (
                analytics.subscriptions.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-lg border border-border bg-white/[0.02] px-4 py-3"
                  >
                    <span className="text-sm font-medium">{item.label}</span>
                    <span className="text-sm text-muted-foreground">
                      {item.value.toLocaleString()} active
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
