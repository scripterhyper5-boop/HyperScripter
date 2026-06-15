export type ActivityStatus = "success" | "pending" | "failed";

export interface AdminRecentActivity {
  id: string;
  user: string;
  action: string;
  date: string;
  status: ActivityStatus;
}

export interface AdminDashboardStats {
  totalUsers: number;
  activeUsers: number;
  scriptsToday: number;
  totalScripts: number;
  revenue: number;
  mrr: number;
}

export interface AdminAiStatus {
  provider: string;
  status: "connected" | "disconnected";
  model: string;
  updatedAt: string | null;
}

export type AiConnectionStatus = "connected" | "invalid" | "not_configured";

export interface AdminAiSettingsView {
  provider: string;
  maskedApiKey: string | null;
  status: AiConnectionStatus;
  model: string;
  updatedAt: string | null;
  source: "database" | "environment" | null;
}

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  plan: "free" | "pro" | "team";
  role: "user" | "admin";
  createdAt: string;
}

export type AdminUserSortField = "name" | "email" | "plan" | "role" | "createdAt";

export interface AdminUserListParams {
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: AdminUserSortField;
  sortDir?: "asc" | "desc";
}

export interface AdminUserListResult {
  users: AdminUserRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AdminUserUpdateInput {
  name: string;
  email: string;
  role: "user" | "admin";
  plan: "free" | "pro" | "team";
}

export interface AdminScriptRow {
  id: string;
  title: string;
  user: string;
  createdAt: string;
  videoType: string;
  tone: string;
}

export interface AdminBlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  seoTitle: string;
  metaDescription: string;
  status: "draft" | "published";
  updatedAt: string;
}

export interface AdminChartPoint {
  label: string;
  value: number;
}

export interface AdminAnalyticsData {
  userGrowth: AdminChartPoint[];
  scriptTrend: AdminChartPoint[];
  subscriptions: AdminChartPoint[];
}

export interface AdminSettings {
  general: {
    siteName: string;
    logo: string;
    domain: string;
  };
  seo: {
    defaultTitle: string;
    defaultDescription: string;
    ogImage: string;
  };
  ai: {
    openaiApiKey: string;
    defaultModel: string;
  };
  appearance: {
    theme: string;
    brandColors: string;
  };
}
