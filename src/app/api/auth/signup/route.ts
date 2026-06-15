import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { signupWithEmailPassword } from "@/lib/auth/local-auth";
import {
  AUTH_SIGNUP_LIMIT,
  REFERRAL_SIGNUP_IP_LIMIT,
  enforceRateLimit,
  getClientIp,
  rateLimitExceededResponse,
} from "@/lib/rate-limit";
import { REFERRAL_COOKIE_NAME } from "@/lib/referrals/constants";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);

    const signupRate = await enforceRateLimit(
      { route: "auth:signup", key: `ip:${ip}`, identifier: ip },
      AUTH_SIGNUP_LIMIT
    );
    if (!signupRate.success) {
      return rateLimitExceededResponse(AUTH_SIGNUP_LIMIT.message, signupRate);
    }

    const body = (await request.json().catch(() => null)) as {
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
      referralCode?: string;
    } | null;

    if (!body) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const referralCode =
      body.referralCode?.trim() ||
      cookieStore.get(REFERRAL_COOKIE_NAME)?.value ||
      undefined;

    if (referralCode) {
      const referralRate = await enforceRateLimit(
        { route: "referral:signup", key: `ip:${ip}`, identifier: ip },
        REFERRAL_SIGNUP_IP_LIMIT
      );
      if (!referralRate.success) {
        return rateLimitExceededResponse(REFERRAL_SIGNUP_IP_LIMIT.message, referralRate);
      }
    }

    const result = await signupWithEmailPassword({
      name: body.name ?? "",
      email: body.email ?? "",
      password: body.password ?? "",
      confirmPassword: body.confirmPassword ?? "",
      referralCode,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    const response = NextResponse.json({ user: result.user });
    response.cookies.delete(REFERRAL_COOKIE_NAME);
    return response;
  } catch (error) {
    console.error("[POST /api/auth/signup]", error);
    return NextResponse.json({ error: "Sign up failed" }, { status: 500 });
  }
}
