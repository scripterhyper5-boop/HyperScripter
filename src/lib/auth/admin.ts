import type { User } from "@/lib/auth/types";

/** True when the user has admin role in the database. */
export function isAdmin(user: User | null | undefined): boolean {
  return user?.role === "admin";
}
