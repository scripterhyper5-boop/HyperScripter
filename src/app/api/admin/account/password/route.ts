import { NextResponse } from "next/server";
import { AdminAccountService } from "@/lib/account/admin-account-service";
import type { ChangePasswordInput } from "@/lib/account/types";
import { requireAdminSession } from "@/lib/account/session-helpers";

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as ChangePasswordInput;
    const result = await AdminAccountService.changePassword(session.user.id, body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error ?? "Password change failed" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/admin/account/password]", error);
    return NextResponse.json({ error: "Password change failed" }, { status: 500 });
  }
}
