import "server-only";

import { PLANS } from "@/lib/plans";
import type {
  AdminAnalyticsData,
  AdminDashboardStats,
  AdminRecentActivity,
} from "@/lib/admin/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { DbBlogPost, DbLegalPage, DbScript, DbSubscription, DbUser } from "@/lib/supabase/types";

const PAID_PLANS = new Set(["pro", "team"]);
const ACTIVE_SUB_STATUSES = new Set(["active", "trialing"]);

function startOfUtcDay(date = new Date()): string {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  ).toISOString();
}

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString();
}

function monthsAgoDate(months: number): Date {
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() - months);
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function monthKey(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

function dayKey(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

function subscriptionMonths(sub: DbSubscription): number {
  const start = new Date(sub.created_at);
  const end =
    sub.status === "cancelled" && sub.current_period_end
      ? new Date(sub.current_period_end)
      : new Date();
  const ms = Math.max(end.getTime() - start.getTime(), 0);
  return Math.max(1, Math.ceil(ms / (30 * 24 * 60 * 60 * 1000)));
}

function planPrice(plan: string): number {
  if (plan === "pro") return PLANS.pro.price;
  if (plan === "team") return PLANS.team.price;
  return 0;
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return {
      totalUsers: 0,
      activeUsers: 0,
      scriptsToday: 0,
      totalScripts: 0,
      revenue: 0,
      mrr: 0,
    };
  }

  const thirtyDaysAgo = daysAgoIso(30);
  const todayStart = startOfUtcDay();
  const activeUsersFilter = `created_at.gte."${thirtyDaysAgo}",updated_at.gte."${thirtyDaysAgo}"`;

  const [
    totalUsersRes,
    activeUsersRes,
    scriptsTodayRes,
    totalScriptsRes,
    subscriptionsRes,
  ] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .or(activeUsersFilter),
    supabase
      .from("scripts")
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayStart),
    supabase.from("scripts").select("*", { count: "exact", head: true }),
    supabase.from("subscriptions").select("plan, status, created_at, current_period_end"),
  ]);

  if (totalUsersRes.error) throw new Error(totalUsersRes.error.message);
  if (activeUsersRes.error) throw new Error(activeUsersRes.error.message);
  if (scriptsTodayRes.error) throw new Error(scriptsTodayRes.error.message);
  if (totalScriptsRes.error) throw new Error(totalScriptsRes.error.message);
  if (subscriptionsRes.error) throw new Error(subscriptionsRes.error.message);

  const subscriptions = (subscriptionsRes.data ?? []) as DbSubscription[];

  let mrr = 0;
  let revenue = 0;

  for (const sub of subscriptions) {
    if (!PAID_PLANS.has(sub.plan)) continue;
    const price = planPrice(sub.plan);
    if (ACTIVE_SUB_STATUSES.has(sub.status)) {
      mrr += price;
      revenue += price * subscriptionMonths(sub);
    }
  }

  return {
    totalUsers: totalUsersRes.count ?? 0,
    activeUsers: activeUsersRes.count ?? 0,
    scriptsToday: scriptsTodayRes.count ?? 0,
    totalScripts: totalScriptsRes.count ?? 0,
    revenue,
    mrr,
  };
}

export async function getAdminRecentActivity(
  limit = 20
): Promise<AdminRecentActivity[]> {
  const supabase = createServerSupabaseClient();
  if (!supabase) return [];

  const [usersRes, scriptsRes, subscriptionsRes, blogRes, legalRes] =
    await Promise.all([
      supabase
        .from("users")
        .select("id, full_name, email, created_at")
        .order("created_at", { ascending: false })
        .limit(limit),
      supabase
        .from("scripts")
        .select("id, user_id, title, created_at")
        .order("created_at", { ascending: false })
        .limit(limit),
      supabase
        .from("subscriptions")
        .select("id, user_id, plan, status, created_at")
        .in("plan", ["pro", "team"])
        .order("created_at", { ascending: false })
        .limit(limit),
      supabase
        .from("blog_posts")
        .select("id, title, status, updated_at")
        .eq("status", "published")
        .order("updated_at", { ascending: false })
        .limit(limit),
      supabase
        .from("legal_pages")
        .select("id, title, status, updated_at")
        .eq("status", "published")
        .order("updated_at", { ascending: false })
        .limit(limit),
    ]);

  if (usersRes.error) throw new Error(usersRes.error.message);
  if (scriptsRes.error) throw new Error(scriptsRes.error.message);
  if (subscriptionsRes.error) throw new Error(subscriptionsRes.error.message);
  if (blogRes.error) {
    console.warn("[getAdminRecentActivity] blog_posts:", blogRes.error.message);
  }
  if (legalRes.error) {
    console.warn("[getAdminRecentActivity] legal_pages:", legalRes.error.message);
  }

  const userIds = new Set<string>();
  for (const script of scriptsRes.data ?? []) {
    userIds.add((script as DbScript).user_id);
  }
  for (const sub of subscriptionsRes.data ?? []) {
    userIds.add((sub as DbSubscription).user_id);
  }

  const userNameById = new Map<string, string>();
  if (userIds.size > 0) {
    const { data: users, error } = await supabase
      .from("users")
      .select("id, full_name, email")
      .in("id", [...userIds]);

    if (error) throw new Error(error.message);
    for (const user of users ?? []) {
      const row = user as Pick<DbUser, "id" | "full_name" | "email">;
      userNameById.set(row.id, row.full_name || row.email);
    }
  }

  const activities: AdminRecentActivity[] = [];

  for (const row of usersRes.data ?? []) {
    const user = row as Pick<DbUser, "id" | "full_name" | "email" | "created_at">;
    activities.push({
      id: `user-${user.id}`,
      user: user.full_name || user.email,
      action: "New account registration",
      date: user.created_at,
      status: "success",
    });
  }

  for (const row of scriptsRes.data ?? []) {
    const script = row as Pick<DbScript, "id" | "user_id" | "title" | "created_at">;
    activities.push({
      id: `script-${script.id}`,
      user: userNameById.get(script.user_id) ?? "Unknown user",
      action: `Generated script — ${script.title}`,
      date: script.created_at,
      status: "success",
    });
  }

  for (const row of subscriptionsRes.data ?? []) {
    const sub = row as Pick<
      DbSubscription,
      "id" | "user_id" | "plan" | "status" | "created_at"
    >;
    activities.push({
      id: `sub-${sub.id}`,
      user: userNameById.get(sub.user_id) ?? "Unknown user",
      action: `Upgraded to ${sub.plan.charAt(0).toUpperCase()}${sub.plan.slice(1)} plan`,
      date: sub.created_at,
      status: sub.status === "past_due" ? "failed" : "success",
    });
  }

  for (const row of blogRes.data ?? []) {
    const post = row as Pick<DbBlogPost, "id" | "title" | "updated_at">;
    activities.push({
      id: `blog-${post.id}`,
      user: "Admin",
      action: `Published blog post — ${post.title}`,
      date: post.updated_at,
      status: "success",
    });
  }

  for (const row of legalRes.data ?? []) {
    const page = row as Pick<DbLegalPage, "id" | "title" | "updated_at">;
    activities.push({
      id: `legal-${page.id}`,
      user: "Admin",
      action: `Published legal page — ${page.title}`,
      date: page.updated_at,
      status: "success",
    });
  }

  return activities
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
}

export async function getAdminAnalyticsData(): Promise<AdminAnalyticsData> {
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return { userGrowth: [], scriptTrend: [], subscriptions: [] };
  }

  const sixMonthsAgo = monthsAgoDate(5).toISOString();
  const sevenDaysAgo = daysAgoIso(6);

  const [usersRes, scriptsRes, subscriptionsRes] = await Promise.all([
    supabase
      .from("users")
      .select("created_at")
      .gte("created_at", sixMonthsAgo),
    supabase
      .from("scripts")
      .select("created_at")
      .gte("created_at", sevenDaysAgo),
    supabase
      .from("subscriptions")
      .select("plan, status")
      .in("status", ["active", "trialing"]),
  ]);

  if (usersRes.error) throw new Error(usersRes.error.message);
  if (scriptsRes.error) throw new Error(scriptsRes.error.message);
  if (subscriptionsRes.error) throw new Error(subscriptionsRes.error.message);

  const monthBuckets = new Map<string, number>();
  for (let i = 5; i >= 0; i--) {
    const d = monthsAgoDate(i);
    monthBuckets.set(monthKey(d), 0);
  }

  for (const row of usersRes.data ?? []) {
    const created = new Date((row as { created_at: string }).created_at);
    const key = monthKey(created);
    if (monthBuckets.has(key)) {
      monthBuckets.set(key, (monthBuckets.get(key) ?? 0) + 1);
    }
  }

  const dayBuckets = new Map<string, number>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    dayBuckets.set(dayKey(d), 0);
  }

  for (const row of scriptsRes.data ?? []) {
    const created = new Date((row as { created_at: string }).created_at);
    const key = dayKey(created);
    if (dayBuckets.has(key)) {
      dayBuckets.set(key, (dayBuckets.get(key) ?? 0) + 1);
    }
  }

  const subCounts = { free: 0, pro: 0, team: 0 };
  for (const row of subscriptionsRes.data ?? []) {
    const plan = (row as { plan: string }).plan;
    if (plan in subCounts) {
      subCounts[plan as keyof typeof subCounts] += 1;
    }
  }

  return {
    userGrowth: [...monthBuckets.entries()].map(([label, value]) => ({
      label,
      value,
    })),
    scriptTrend: [...dayBuckets.entries()].map(([label, value]) => ({
      label,
      value,
    })),
    subscriptions: [
      { label: "Free", value: subCounts.free },
      { label: "Pro", value: subCounts.pro },
      { label: "Team", value: subCounts.team },
    ],
  };
}
