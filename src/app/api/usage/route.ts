import { NextResponse } from "next/server";
import { getUserById } from "@/lib/db/users";
import { getScriptUsageAllowanceForUser } from "@/lib/db/usage";
import { resolveUserPlan } from "@/lib/auth/resolve-plan";
import { getUserServerSession } from "@/lib/auth/session";
import { formatPlanName } from "@/lib/plans";
import { isSupabaseServerConfigured } from "@/lib/supabase/server";

export async function GET() {
  const session = await getUserServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let user = session.user;

    if (isSupabaseServerConfigured()) {
      const account = await getUserById(session.user.id);
      if (account?.user) {
        user = {
          ...account.user,
          role: session.user.role ?? account.user.role,
          plan: resolveUserPlan(account.user),
        };
      }
    }

    const allowance = await getScriptUsageAllowanceForUser(user);

    return NextResponse.json({
      plan: user.plan,
      planName: formatPlanName(user.plan),
      ...allowance,
    });
  } catch (error) {
    console.error("[GET /api/usage]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load usage" },
      { status: 500 }
    );
  }
}
