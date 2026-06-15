import { NextResponse } from "next/server";
import { UserAccountService } from "@/lib/account/user-account-service";
import type { ChangePasswordInput } from "@/lib/account/types";
import { requireUserSession } from "@/lib/account/session-helpers";

export async function POST(request: Request) {
  const session = await requireUserSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as ChangePasswordInput;
    const result = await UserAccountService.changePassword(session.user.id, body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error ?? "Password change failed" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/account/password]", error);
    return NextResponse.json({ error: "Password change failed" }, { status: 500 });
  }
}
