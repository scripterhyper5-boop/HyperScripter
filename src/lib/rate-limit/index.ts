export type { RateLimitCheckResult, RateLimitConfig, RateLimitContext } from "@/lib/rate-limit/types";
export {
  AUTH_FORGOT_PASSWORD_LIMIT,
  AUTH_LOGIN_LIMIT,
  AUTH_SIGNUP_LIMIT,
  GENERATE_LIMITS,
  RATE_LIMIT_CODES,
  REFERRAL_SIGNUP_IP_LIMIT,
  SUPPORT_REPLY_LIMIT,
  SUPPORT_TICKET_LIMIT,
} from "@/lib/rate-limit/config";
export { getClientIp } from "@/lib/rate-limit/client-ip";
export { enforceRateLimit, logRateLimitBlock } from "@/lib/rate-limit/enforce";
export { rateLimitExceededResponse } from "@/lib/rate-limit/response";
export { consumeRateLimit, getRateLimitStorage } from "@/lib/rate-limit/store";
