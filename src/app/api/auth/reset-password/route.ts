import { NextResponse } from "next/server";
import { validatePasswordResetToken } from "@/lib/db/password-reset";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token")?.trim();

    if (!token) {
      return NextResponse.json({ valid: false }, { status: 400 });
    }

    const result = await validatePasswordResetToken(token);
    return NextResponse.json({ valid: Boolean(result) });
  } catch (error) {
    console.error("[GET /api/auth/reset-password]", error);
    return NextResponse.json({ valid: false }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      token?: string;
      password?: string;
      confirmPassword?: string;
    };

    const token = body.token?.trim();
    const password = body.password ?? "";
    const confirmPassword = body.confirmPassword ?? "";

    if (!token) {
      return NextResponse.json({ error: "Reset token is required" }, { status: 400 });
    }

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
    }

    const { consumePasswordResetToken } = await import("@/lib/db/password-reset");
    const { hashPassword } = await import("@/lib/auth/password");
    const { updateUserPasswordHash } = await import("@/lib/db/users");

    const userId = await consumePasswordResetToken(token);
    if (!userId) {
      return NextResponse.json(
        { error: "Invalid or expired reset link" },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);
    await updateUserPasswordHash(userId, passwordHash);

    return NextResponse.json({
      success: true,
      message: "Password updated successfully. You can sign in with your new password.",
    });
  } catch (error) {
    console.error("[POST /api/auth/reset-password]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Password reset failed" },
      { status: 500 }
    );
  }
}
