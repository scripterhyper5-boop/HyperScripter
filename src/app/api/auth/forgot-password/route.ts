import { NextResponse } from "next/server";
import { createPasswordResetToken } from "@/lib/db/password-reset";
import { getUserByEmail } from "@/lib/db/users";
import { sendPasswordResetEmail } from "@/lib/email/send-emails";
import {
  AUTH_FORGOT_PASSWORD_LIMIT,
  enforceRateLimit,
  getClientIp,
  rateLimitExceededResponse,
} from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rate = await enforceRateLimit(
      { route: "auth:forgot-password", key: `ip:${ip}`, identifier: ip },
      AUTH_FORGOT_PASSWORD_LIMIT
    );
    if (!rate.success) {
      return rateLimitExceededResponse(AUTH_FORGOT_PASSWORD_LIMIT.message, rate);
    }

    const body = (await request.json().catch(() => null)) as { email?: string } | null;
    const email = body?.email?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const account = await getUserByEmail(email);

    if (account) {
      try {
        const token = await createPasswordResetToken(account.userId);
        await sendPasswordResetEmail({
          name: account.user.name,
          email: account.user.email,
          resetToken: token,
        });
      } catch (error) {
        console.error("[POST /api/auth/forgot-password] send email", error);
      }
    }

    return NextResponse.json({
      success: true,
      message:
        "If an account exists for that email, password reset instructions have been sent.",
    });
  } catch (error) {
    console.error("[POST /api/auth/forgot-password]", error);
    return NextResponse.json(
      { error: "Password reset request failed" },
      { status: 500 }
    );
  }
}
