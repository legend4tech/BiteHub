import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// Fallback for local development if Upstash env vars are missing
const hasUpstashConfig =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN

// Initialize Redis only if env vars are present, otherwise use a mock (which will fail if actually called, but we won't call it)
const redis = hasUpstashConfig
  ? Redis.fromEnv()
  : new Redis({ url: "https://mock.upstash.io", token: "mock" })

export const isRateLimitingEnabled = true

// Strict Rate Limiter for Auth / Sensitive Routes: 10 requests per 1 minute per Device
export const strictRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  analytics: true,
  prefix: "bitehub:ratelimit:strict:device",
})

// Strict Rate Limiter (IP Fallback): 20 requests per 1 minute per IP
// 20/min is generous for legitimate users (~4 requests per login flow) while
// effectively blocking automated brute-force attacks on auth endpoints.
export const strictIpRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "1 m"),
  analytics: true,
  prefix: "bitehub:ratelimit:strict:ip",
})
