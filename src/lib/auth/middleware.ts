import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  hasSessionCookieValue,
  SESSION_COOKIE,
} from "@/lib/auth/session-constants";
import {
  ADMIN_AUTH_ROUTES,
  ADMIN_PUBLIC_PATHS,
  USER_AUTH_ROUTES,
} from "@/lib/auth/constants";
import {
  normalizeReferralCode,
  referralCookieOptions,
} from "@/lib/referrals/cookie";

const USER_AUTH_PATHS = [
  USER_AUTH_ROUTES.login,
  USER_AUTH_ROUTES.signup,
  USER_AUTH_ROUTES.forgotPassword,
  USER_AUTH_ROUTES.resetPassword,
];

function isUserAuthPath(pathname: string): boolean {
  return USER_AUTH_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

function isDashboardPath(pathname: string): boolean {
  return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
}

function isAdminPanelPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

function isAdminPublicPath(pathname: string): boolean {
  return ADMIN_PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

/** Presence-only — signature verification is done in server routes/layouts. */
function hasSession(request: NextRequest): boolean {
  return hasSessionCookieValue(request.cookies.get(SESSION_COOKIE)?.value);
}

export function authMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const signedIn = hasSession(request);

  if (pathname.startsWith("/debug") || pathname === "/test") {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (isUserAuthPath(pathname) && signedIn) {
    const redirectParam = request.nextUrl.searchParams.get("redirect");
    const destination =
      redirectParam?.startsWith("/") && !redirectParam.startsWith("//")
        ? redirectParam
        : USER_AUTH_ROUTES.dashboard;
    return NextResponse.redirect(new URL(destination, request.url));
  }

  if (isDashboardPath(pathname) && !signedIn) {
    const login = new URL(USER_AUTH_ROUTES.login, request.url);
    login.searchParams.set("redirect", pathname);
    return NextResponse.redirect(login);
  }

  if (isAdminPanelPath(pathname) && !isAdminPublicPath(pathname) && !signedIn) {
    return NextResponse.redirect(new URL(ADMIN_AUTH_ROUTES.login, request.url));
  }

  if (pathname === USER_AUTH_ROUTES.signup) {
    const refCode = normalizeReferralCode(request.nextUrl.searchParams.get("ref"));
    if (refCode) {
      const response = NextResponse.next();
      const opts = referralCookieOptions();
      response.cookies.set(opts.name, refCode, {
        maxAge: opts.maxAge,
        httpOnly: opts.httpOnly,
        sameSite: opts.sameSite,
        path: opts.path,
        secure: opts.secure,
      });
      return response;
    }
  }

  // Admin role enforcement: admin/(panel)/layout.tsx (server-side HMAC verify).
  return NextResponse.next();
}
