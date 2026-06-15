import type { UserRole } from "@/lib/auth/types";

/** HTTP-only session cookie name — safe to import from Edge middleware. */
export const SESSION_COOKIE = "hs_session";

export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export interface SessionPayload {
  userId: string;
  role: UserRole;
  exp: number;
}

/**
 * Edge-safe presence check only. Does NOT verify the HMAC signature.
 * Full validation happens in server routes via session-cookie.ts.
 */
export function hasSessionCookieValue(token: string | undefined | null): boolean {
  if (!token) return false;
  const parts = token.split(".");
  return parts.length === 2 && parts[0].length > 0 && parts[1].length > 0;
}
