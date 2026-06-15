import { NextResponse } from "next/server";
import { loginWithEmailPassword } from "@/lib/auth/local-auth";
import {
  AUTH_LOGIN_LIMIT,
  enforceRateLimit,
  getClientIp,
  rateLimitExceededResponse,
} from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rate = await enforceRateLimit(
      { route: "auth:login", key: `ip:${ip}`, identifier: ip },
      AUTH_LOGIN_LIMIT
    );
    if (!rate.success) {
      return rateLimitExceededResponse(AUTH_LOGIN_LIMIT.message, rate);
    }

    const body = (await request.json().catch(() => null)) as {
      email?: string;
      password?: string;
      admin?: boolean;
    } | null;

    if (!body?.email || !body?.password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const result = await loginWithEmailPassword(body.email, body.password, {
      requireAdmin: Boolean(body.admin),
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json({ user: result.user });
  } catch (error) {
    console.error("[POST /api/auth/login]", error);
    return NextResponse.json({ error: "Sign in failed" }, { status: 500 });
  }
}
