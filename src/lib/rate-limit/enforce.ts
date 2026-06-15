import "server-only";

import { consumeRateLimit } from "@/lib/rate-limit/store";
import type { RateLimitConfig, RateLimitCheckResult, RateLimitContext } from "@/lib/rate-limit/types";

export function logRateLimitBlock(
  context: RateLimitContext,
  config: RateLimitConfig,
  result: RateLimitCheckResult
): void {
  console.warn("[rate-limit] blocked", {
    route: context.route,
    key: context.key,
    identifier: context.identifier ?? null,
    limit: config.limit,
    windowSeconds: config.windowSeconds,
    remaining: result.remaining,
    reset: new Date(result.reset).toISOString(),
    storage: result.storage,
  });
}

export async function enforceRateLimit(
  context: RateLimitContext,
  config: RateLimitConfig
): Promise<RateLimitCheckResult> {
  const result = await consumeRateLimit(context.key, config.limit, config.windowSeconds, {
    prefix: `rl:${context.route}`,
  });

  if (!result.success) {
    logRateLimitBlock(context, config, result);
  }

  return result;
}
