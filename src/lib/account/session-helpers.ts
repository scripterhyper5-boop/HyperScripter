import { getAdminServerSession, getUserServerSession } from "@/lib/auth/session";

export async function requireUserSession() {
  const session = await getUserServerSession();
  if (!session) return null;
  return session;
}

export async function requireAdminSession() {
  const session = await getAdminServerSession();
  if (!session) return null;
  return session;
}
