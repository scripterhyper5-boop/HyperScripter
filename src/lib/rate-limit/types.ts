export interface RateLimitConfig {
  limit: number;
  windowSeconds: number;
  /** Human-readable window for error messages */
  windowLabel: string;
  message: string;
}

export interface RateLimitCheckResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  storage: "upstash" | "database" | "memory";
}

export interface RateLimitContext {
  route: string;
  key: string;
  identifier?: string;
}
