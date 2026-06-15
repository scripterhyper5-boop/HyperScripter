import "server-only";

import { createHash, randomBytes } from "crypto";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const TOKEN_BYTES = 32;
const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createPasswordResetToken(userId: string): Promise<string> {
  const supabase = createServerSupabaseClient();
  if (!supabase) throw new Error("Database not configured");

  const token = randomBytes(TOKEN_BYTES).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString();

  await supabase
    .from("password_reset_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("used_at", null);

  const { error } = await supabase.from("password_reset_tokens").insert({
    user_id: userId,
    token_hash: tokenHash,
    expires_at: expiresAt,
    created_at: new Date().toISOString(),
  });

  if (error) throw new Error(error.message);
  return token;
}

export async function validatePasswordResetToken(
  token: string
): Promise<{ userId: string } | null> {
  const supabase = createServerSupabaseClient();
  if (!supabase) return null;

  const tokenHash = hashToken(token);
  const { data, error } = await supabase
    .from("password_reset_tokens")
    .select("id, user_id, expires_at, used_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error || !data) return null;
  if (data.used_at) return null;
  if (new Date(data.expires_at as string).getTime() < Date.now()) return null;

  return { userId: data.user_id as string };
}

export async function consumePasswordResetToken(token: string): Promise<string | null> {
  const supabase = createServerSupabaseClient();
  if (!supabase) return null;

  const tokenHash = hashToken(token);
  const { data, error } = await supabase
    .from("password_reset_tokens")
    .select("id, user_id, expires_at, used_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error || !data) return null;
  if (data.used_at) return null;
  if (new Date(data.expires_at as string).getTime() < Date.now()) return null;

  const { error: updateError } = await supabase
    .from("password_reset_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("id", data.id);

  if (updateError) return null;
  return data.user_id as string;
}
