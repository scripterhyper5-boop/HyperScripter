import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { RateLimitCheckResult } from "@/lib/rate-limit/types";

let redisClient: Redis | null = null;
const upstashLimiters = new Map<string, Ratelimit>();

/** Dev-only in-process fallback when neither Upstash nor DB migration is available. */
const memoryBuckets = new Map<string, { count: number; reset: number }>();

function isUpstashConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL?.trim() &&
      process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  );
}

function getRedis(): Redis {
  if (!redisClient) {
    redisClient = Redis.fromEnv();
  }
  return redisClient;
}

function windowLabel(seconds: number): `${number} s` | `${number} m` | `${number} h` | `${number} d` {
  if (seconds % 86400 === 0) return `${seconds / 86400} d`;
  if (seconds % 3600 === 0) return `${seconds / 3600} h`;
  if (seconds % 60 === 0) return `${seconds / 60} m`;
  return `${seconds} s`;
}

function getUpstashLimiter(limit: number, windowSeconds: number, prefix: string): Ratelimit {
  const cacheKey = `${prefix}:${limit}:${windowSeconds}`;
  const existing = upstashLimiters.get(cacheKey);
  if (existing) return existing;

  const limiter = new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(limit, windowLabel(windowSeconds)),
    prefix,
    analytics: true,
  });
  upstashLimiters.set(cacheKey, limiter);
  return limiter;
}

async function checkUpstash(
  key: string,
  limit: number,
  windowSeconds: number,
  prefix: string
): Promise<RateLimitCheckResult> {
  const limiter = getUpstashLimiter(limit, windowSeconds, prefix);
  const result = await limiter.limit(key);

  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
    storage: "upstash",
  };
}

async function checkDatabase(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitCheckResult | null> {
  const supabase = createServerSupabaseClient();
  const windowId = Math.floor(Date.now() / 1000 / windowSeconds);
  const bucketKey = `${key}:${windowId}`;

  const { data, error } = await supabase.rpc("increment_rate_limit_counter", {
    p_bucket_key: bucketKey,
    p_window_id: windowId,
    p_limit: limit,
  });

  if (error) {
    if (error.code === "PGRST202" || error.message.includes("increment_rate_limit_counter")) {
      return null;
    }
    throw new Error(error.message);
  }

  const payload = data as { count?: number; success?: boolean } | null;
  const count = payload?.count ?? 1;
  const success = payload?.success ?? count <= limit;
  const reset = (windowId + 1) * windowSeconds * 1000;

  return {
    success,
    limit,
    remaining: Math.max(0, limit - count),
    reset,
    storage: "database",
  };
}

function checkMemory(
  key: string,
  limit: number,
  windowSeconds: number
): RateLimitCheckResult {
  const now = Date.now();
  const windowId = Math.floor(now / 1000 / windowSeconds);
  const bucketKey = `${key}:${windowId}`;
  const reset = (windowId + 1) * windowSeconds * 1000;

  const existing = memoryBuckets.get(bucketKey);
  const count = existing && existing.reset === reset ? existing.count + 1 : 1;
  memoryBuckets.set(bucketKey, { count, reset });

  return {
    success: count <= limit,
    limit,
    remaining: Math.max(0, limit - count),
    reset,
    storage: "memory",
  };
}

export async function consumeRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
  options?: { prefix?: string }
): Promise<RateLimitCheckResult> {
  const prefix = options?.prefix ?? "rl";

  if (isUpstashConfigured()) {
    return checkUpstash(key, limit, windowSeconds, prefix);
  }

  try {
    const dbResult = await checkDatabase(key, limit, windowSeconds);
    if (dbResult) return dbResult;
  } catch (error) {
    console.error("[rate-limit] database check failed:", error);
  }

  if (process.env.NODE_ENV !== "production") {
    console.warn(
      "[rate-limit] Using in-memory fallback. Configure UPSTASH_REDIS_REST_URL or run supabase/rate-limit-schema.sql for production."
    );
    return checkMemory(key, limit, windowSeconds);
  }

  throw new Error(
    "Rate limiting is not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN, or run rate-limit-schema.sql."
  );
}

export function getRateLimitStorage(): "upstash" | "database" | "memory" {
  if (isUpstashConfigured()) return "upstash";
  return "database";
}
