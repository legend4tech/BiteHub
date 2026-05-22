import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Fallback for local development if Upstash env vars are missing
const hasUpstashConfig = !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

// Initialize Redis only if env vars are present, otherwise use a mock (which will fail if actually called, but we won't call it)
const redis = hasUpstashConfig 
  ? Redis.fromEnv() 
  : new Redis({ url: "https://mock.upstash.io", token: "mock" });

export const isRateLimitingEnabled = hasUpstashConfig;

// Global Rate Limiter: 50 requests per 10 seconds per Device
export const globalRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(50, "10 s"),
  analytics: true,
  prefix: "bitehub:ratelimit:global:device",
});

// Global Rate Limiter (IP Fallback): 500 requests per 10 seconds per IP
export const globalIpRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(500, "10 s"),
  analytics: true,
  prefix: "bitehub:ratelimit:global:ip",
});

// Strict Rate Limiter for Auth / Sensitive Routes: 10 requests per 1 minute per Device
export const strictRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  analytics: true,
  prefix: "bitehub:ratelimit:strict:device",
});

// Strict Rate Limiter (IP Fallback): 100 requests per 1 minute per IP
export const strictIpRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 m"),
  analytics: true,
  prefix: "bitehub:ratelimit:strict:ip",
});
