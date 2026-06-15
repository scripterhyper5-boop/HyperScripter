import "server-only";

import type { UserRole } from "@/lib/auth/types";

/** Configured admin email from ADMIN_EMAIL env (server-only). */
export function getAdminEmail(): string | undefined {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  return email || undefined;
}

/** Assign admin when email matches ADMIN_EMAIL; otherwise user. */
export function resolveRoleForEmail(
  email: string | null | undefined
): UserRole {
  const adminEmail = getAdminEmail();
  const normalized = email?.trim().toLowerCase() ?? "";

  if (adminEmail && normalized === adminEmail) {
    return "admin";
  }

  return "user";
}
