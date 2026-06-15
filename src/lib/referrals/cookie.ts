import {
  REFERRAL_COOKIE_MAX_AGE,
  REFERRAL_COOKIE_NAME,
} from "@/lib/referrals/constants";

export { REFERRAL_COOKIE_NAME, REFERRAL_COOKIE_MAX_AGE };

export function normalizeReferralCode(code: string | null | undefined): string | null {
  const normalized = code?.trim().toUpperCase() ?? "";
  if (!normalized || normalized.length < 4) return null;
  return normalized;
}

export function referralCookieOptions() {
  return {
    name: REFERRAL_COOKIE_NAME,
    maxAge: REFERRAL_COOKIE_MAX_AGE,
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
  };
}
