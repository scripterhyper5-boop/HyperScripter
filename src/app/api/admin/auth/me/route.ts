import { NextResponse } from "next/server";
import { getUserById } from "@/lib/db/users";
import { resolveUserPlan } from "@/lib/auth/resolve-plan";
import { getAdminServerSession } from "@/lib/auth/session";
import type { User } from "@/lib/auth/types";
import { isSupabaseServerConfigured } from "@/lib/supabase/server";

function mergeAdminUser(sessionUser: User, storedUser?: User): User {
  const base = storedUser ?? sessionUser;
  const merged: User = {
    ...base,
    id: base.id || sessionUser.id,
    email: base.email || sessionUser.email,
    name: base.name || sessionUser.name,
    role: sessionUser.role,
    plan: storedUser?.plan ?? sessionUser.plan ?? "pro",
    createdAt: base.createdAt || sessionUser.createdAt,
    avatarUrl: base.avatarUrl ?? sessionUser.avatarUrl,
  };
  merged.plan = resolveUserPlan(merged);
  return merged;
}

export async function GET() {
  const session = await getAdminServerSession();
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  let storedUser: User | undefined;
  if (isSupabaseServerConfigured()) {
    try {
      const account = await getUserById(session.user.id);
      storedUser = account?.user;
    } catch (error) {
      console.error("[GET /api/admin/auth/me] Failed to load stored user:", error);
    }
  }

  const user = mergeAdminUser(session.user, storedUser);
  return NextResponse.json({ user });
}
