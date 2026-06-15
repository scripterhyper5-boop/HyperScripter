/**
 * Client-safe Supabase exports only.
 * Server code must import from `@/lib/supabase/server`.
 */
export type {
  Database,
  DbUser,
  DbScript,
  DbBlogPost,
  DbLegalPage,
} from "@/lib/supabase/types";

export {
  createBrowserSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
