import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let warnedMissingServiceRole = false;

function resolveServerConfig(): { url: string; serviceRoleKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) {
    const message =
      "[HyperScripter] Server Supabase requires NEXT_PUBLIC_SUPABASE_URL and " +
      "SUPABASE_SERVICE_ROLE_KEY. The anon key must never be used for server operations.";

    if (process.env.NODE_ENV !== "production") {
      if (!warnedMissingServiceRole) {
        warnedMissingServiceRole = true;
        console.warn(`⚠️  ${message}`);
        if (!serviceRoleKey) {
          console.warn(
            "⚠️  Add SUPABASE_SERVICE_ROLE_KEY to .env.local (Supabase Dashboard → Settings → API)."
          );
        }
      }
    }

    throw new Error(message);
  }

  return { url, serviceRoleKey };
}

/** Server-side Supabase client — service role only (bypasses RLS). */
export function createServerSupabaseClient(): SupabaseClient {
  const { url, serviceRoleKey } = resolveServerConfig();
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Whether server Supabase env vars are set (service role required). */
export function isSupabaseServerConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  );
}
