import { NextResponse } from "next/server";
import { AdminAccountService } from "@/lib/account/admin-account-service";
import type { UpdateAccountProfileInput } from "@/lib/account/types";
import { requireAdminSession } from "@/lib/account/session-helpers";

export async function GET() {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await AdminAccountService.getProfile(session.user.id);
    if (result.success && result.data) {
      return NextResponse.json({ profile: result.data });
    }
  } catch (error) {
    console.error("[GET /api/admin/account/profile]", error);
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
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as UpdateAccountProfileInput;
    const result = await AdminAccountService.updateProfile(session.user.id, body);

    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: result.error ?? "Update failed" },
        { status: 400 }
      );
    }

    return NextResponse.json({ profile: result.data });
  } catch (error) {
    console.error("[PATCH /api/admin/account/profile]", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
