import type { PlanId } from "@/lib/plans";
import type { RateLimitConfig } from "@/lib/rate-limit/types";

export const RATE_LIMIT_CODES = {
  LIMITED: "RATE_LIMITED",
} as const;

export const AUTH_LOGIN_LIMIT: RateLimitConfig = {
  limit: 5,
  windowSeconds: 15 * 60,
  windowLabel: "15 minutes",
  message:
    "Too many sign-in attempts. Please wait 15 minutes and try again.",
};

export const AUTH_SIGNUP_LIMIT: RateLimitConfig = {
  limit: 3,
  windowSeconds: 60 * 60,
  windowLabel: "1 hour",
  message:
    "Too many accounts were created from your network. Please try again in an hour.",
};

export const AUTH_FORGOT_PASSWORD_LIMIT: RateLimitConfig = {
  limit: 3,
  windowSeconds: 60 * 60,
  windowLabel: "1 hour",
  message:
    "Too many password reset requests. Please try again in an hour.",
};

export const REFERRAL_SIGNUP_IP_LIMIT: RateLimitConfig = {
  limit: 10,
  windowSeconds: 24 * 60 * 60,
  windowLabel: "24 hours",
  message:
    "Too many referral signups from your network today. Please try again tomorrow.",
};

export const SUPPORT_TICKET_LIMIT: RateLimitConfig = {
  limit: 10,
  windowSeconds: 60 * 60,
  windowLabel: "1 hour",
  message:
    "You've opened too many support tickets. Please try again in an hour.",
};

export const SUPPORT_REPLY_LIMIT: RateLimitConfig = {
  limit: 30,
  windowSeconds: 60 * 60,
  windowLabel: "1 hour",
  message:
    "You're sending messages too quickly. Please wait before replying again.",
};

export const GENERATE_LIMITS: Record<PlanId, RateLimitConfig> = {
  free: {
    limit: 5,
    windowSeconds: 60,
    windowLabel: "1 minute",
    message:
      "You're generating scripts too quickly. Please wait a moment and try again.",
  },
  pro: {
    limit: 20,
    windowSeconds: 60,
    windowLabel: "1 minute",
    message:
      "You're generating scripts too quickly. Please slow down and try again shortly.",
  },
  team: {
    limit: 50,
    windowSeconds: 60,
    windowLabel: "1 minute",
    message:
      "You're generating scripts too quickly. Please slow down and try again shortly.",
  },
};
