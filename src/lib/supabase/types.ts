export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "user" | "admin";
export type PlanId = "free" | "pro" | "team";
export type ContentStatus = "draft" | "published";
export type SubscriptionStatus = "active" | "cancelled" | "past_due" | "trialing";

export interface DbUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  plan: PlanId;
  avatar_url: string | null;
  password_hash: string | null;
  created_at: string;
}

export interface DbScript {
  id: string;
  user_id: string;
  title: string;
  niche: string | null;
  video_type: string | null;
  tone: string | null;
  hook_style: string | null;
  content: Json;
  created_at: string;
}

export interface DbBlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  status: ContentStatus;
  created_at: string;
  updated_at: string;
}

export interface DbLegalPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  status: ContentStatus;
  updated_at: string;
}

export interface DbSubscription {
  id: string;
  user_id: string;
  plan: PlanId;
  status: SubscriptionStatus;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_end: string | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: DbUser;
        Insert: {
          id: string;
          email: string;
          full_name: string;
          role?: UserRole;
          plan?: PlanId;
          avatar_url?: string | null;
          password_hash?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          role?: UserRole;
          plan?: PlanId;
          avatar_url?: string | null;
          password_hash?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      scripts: {
        Row: DbScript;
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          niche?: string | null;
          video_type?: string | null;
          tone?: string | null;
          hook_style?: string | null;
          content?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          niche?: string | null;
          video_type?: string | null;
          tone?: string | null;
          hook_style?: string | null;
          content?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      blog_posts: {
        Row: DbBlogPost;
        Insert: {
          id?: string;
          title: string;
          slug: string;
          excerpt?: string | null;
          content?: string;
          status?: ContentStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          excerpt?: string | null;
          content?: string;
          status?: ContentStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      legal_pages: {
        Row: DbLegalPage;
        Insert: {
          id?: string;
          title: string;
          slug: string;
          content?: string;
          status?: ContentStatus;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          content?: string;
          status?: ContentStatus;
          updated_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: DbSubscription;
        Insert: {
          id?: string;
          user_id: string;
          plan: PlanId;
          status?: SubscriptionStatus;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          current_period_end?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan?: PlanId;
          status?: SubscriptionStatus;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          current_period_end?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      usage_records: {
        Row: {
          id: string;
          user_id: string;
          action: string;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          action: string;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          action?: string;
          metadata?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
