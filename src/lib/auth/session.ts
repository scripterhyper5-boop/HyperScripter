import "server-only";

import type { Session } from "./types";
import { isAdmin } from "./admin";
import { getSessionPayload, SESSION_MAX_AGE } from "./session-cookie";
import { getUserById } from "@/lib/db/users";

export async function getUserServerSession(): Promise<Session | null> {
  try {
    const payload = await getSessionPayload();
    if (!payload) return null;

    const account = await getUserById(payload.userId);
    if (!account) return null;

    return {
      user: account.user,
      expiresAt: payload.exp,
    };
  } catch (error) {
    console.error("[getUserServerSession]", error);
    return null;
  }
}

export async function getAdminServerSession(): Promise<Session | null> {
  const session = await getUserServerSession();
  if (!session || !isAdmin(session.user)) return null;
  return session;
}

/** @deprecated Use getUserServerSession */
export async function getServerSession(): Promise<Session | null> {
  return getUserServerSession();
}

export { SESSION_MAX_AGE };
