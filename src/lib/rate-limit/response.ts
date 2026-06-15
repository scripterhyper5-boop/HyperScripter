import { NextResponse } from "next/server";
import { RATE_LIMIT_CODES } from "@/lib/rate-limit/config";
import type { RateLimitCheckResult } from "@/lib/rate-limit/types";

export function rateLimitExceededResponse(
  message: string,
  result: Pick<RateLimitCheckResult, "reset" | "limit" | "remaining">
): NextResponse {
  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((result.reset - Date.now()) / 1000)
  );

  return NextResponse.json(
    {
      error: message,
      code: RATE_LIMIT_CODES.LIMITED,
      retryAfter: retryAfterSeconds,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(Math.max(0, result.remaining)),
        "X-RateLimit-Reset": String(Math.ceil(result.reset / 1000)),
      },
    }
  );
}
