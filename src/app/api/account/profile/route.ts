import { NextResponse } from "next/server";
import { UserAccountService } from "@/lib/account/user-account-service";
import type { UpdateAccountProfileInput } from "@/lib/account/types";
import { requireUserSession } from "@/lib/account/session-helpers";

export async function GET() {
  const session = await requireUserSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await UserAccountService.getProfile(session.user.id);
    if (result.success && result.data) {
      return NextResponse.json({ profile: result.data });
    }
  } catch (error) {
    console.error("[GET /api/account/profile]", error);
  }

  return NextResponse.json({
    profile: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      avatarUrl: session.user.avatarUrl,
      plan: session.user.plan,
    },
  });
}

export async function PATCH(request: Request) {
  const session = await requireUserSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as UpdateAccountProfileInput;
    const result = await UserAccountService.updateProfile(session.user.id, body);

    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: result.error ?? "Update failed" },
        { status: 400 }
      );
    }

    return NextResponse.json({ profile: result.data });
  } catch (error) {
    console.error("[PATCH /api/account/profile]", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
