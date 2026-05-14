import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";
import { globalRateLimiter, strictRateLimiter, isRateLimitingEnabled } from "@/lib/rate-limit";

const { auth } = NextAuth(authConfig);

export default auth(async (req) => {
  // 1. Rate Limiting Logic
  if (isRateLimitingEnabled) {
    const ip = (req as any).ip ?? req.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const path = req.nextUrl.pathname;

    // Strict Rate Limiting for Auth Login & Sensitive routes
    const isLoginAttempt = req.method === "POST" && path === "/api/auth/callback/credentials";
    const isOrderRoute = path.startsWith("/api/orders");

    if (isLoginAttempt || isOrderRoute) {
      const { success, limit, reset, remaining } = await strictRateLimiter.limit(`strict_${ip}`);
      if (!success) {
        return NextResponse.json(
          { error: "Too Many Requests", message: "Rate limit exceeded. Please try again later." },
          {
            status: 429,
            headers: {
              "X-RateLimit-Limit": limit.toString(),
              "X-RateLimit-Remaining": remaining.toString(),
              "X-RateLimit-Reset": reset.toString(),
            },
          }
        );
      }
    }
    // Global Rate Limiting for all other API routes
    else if (path.startsWith("/api/")) {
      const { success, limit, reset, remaining } = await globalRateLimiter.limit(`global_${ip}`);
      if (!success) {
        return new NextResponse("Too Many Requests", {
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
          },
        });
      }
    }
  }

  // 2. Pass request to next handler (auth checks are handled by NextAuth callbacks in auth.config.ts)
  return NextResponse.next();
});

export const config = {
  // Match all routes except static files, images, and next internal routes
  matcher: ["/((?!_next/static|_next/image|.*\\.png$).*)"],
};
