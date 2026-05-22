import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";
import { globalRateLimiter, globalIpRateLimiter, strictRateLimiter, strictIpRateLimiter, isRateLimitingEnabled } from "@/lib/rate-limit";

const { auth } = NextAuth(authConfig);

export default auth(async (req) => {
  // 0. Maintenance Mode Check
  if (process.env.MAINTENANCE_MODE === "true") {
    const path = req.nextUrl.pathname;
    
    // If it's an API route, return 503
    if (path.startsWith("/api/")) {
      return new NextResponse(
        JSON.stringify({ error: "Service Unavailable", message: "BiteHub is currently undergoing maintenance." }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // Rewrite all other requests to the maintenance page (unless they are already going there)
    if (path !== "/maintenance") {
      return NextResponse.rewrite(new URL("/maintenance", req.url));
    }
  }

  let deviceId = req.cookies.get("bitehub_device_id")?.value;
  let isNewDevice = false;
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    isNewDevice = true;
  }

  // 1. Rate Limiting Logic
  if (isRateLimitingEnabled) {
    const ip = (req as any).ip ?? req.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const path = req.nextUrl.pathname;

    // Strict Rate Limiting for Auth Login & Sensitive routes
    const isLoginAttempt = req.method === "POST" && path === "/api/auth/callback/credentials";
    const isOrderRoute = path.startsWith("/api/orders");

    if (isLoginAttempt || isOrderRoute) {
      const [deviceLimit, ipLimit] = await Promise.all([
        strictRateLimiter.limit(`strict_device_${deviceId}`),
        strictIpRateLimiter.limit(`strict_ip_${ip}`)
      ]);

      if (!deviceLimit.success || !ipLimit.success) {
        const failedLimit = !deviceLimit.success ? deviceLimit : ipLimit;
        return NextResponse.json(
          { error: "Too Many Requests", message: "Rate limit exceeded. Please try again later." },
          {
            status: 429,
            headers: {
              "X-RateLimit-Limit": failedLimit.limit.toString(),
              "X-RateLimit-Remaining": failedLimit.remaining.toString(),
              "X-RateLimit-Reset": failedLimit.reset.toString(),
            },
          }
        );
      }
    }
    // Global Rate Limiting for all other API routes
    else if (path.startsWith("/api/")) {
      const [deviceLimit, ipLimit] = await Promise.all([
        globalRateLimiter.limit(`global_device_${deviceId}`),
        globalIpRateLimiter.limit(`global_ip_${ip}`)
      ]);

      if (!deviceLimit.success || !ipLimit.success) {
        const failedLimit = !deviceLimit.success ? deviceLimit : ipLimit;
        return new NextResponse("Too Many Requests", {
          status: 429,
          headers: {
            "X-RateLimit-Limit": failedLimit.limit.toString(),
            "X-RateLimit-Remaining": failedLimit.remaining.toString(),
            "X-RateLimit-Reset": failedLimit.reset.toString(),
          },
        });
      }
    }
  }

  // 2. Auth guard — enforce role-based access at the edge to prevent flash-of-protected-content
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const isLoggedIn = !!session?.user;
  const role = (session?.user as any)?.role;

  const isOnAdmin = pathname.startsWith("/admin");
  const isAdminLoginRoute = pathname === "/admin/login";
  const isOnVendorProtected =
    pathname.startsWith("/vendor/") &&
    pathname !== "/vendor/login" &&
    pathname !== "/vendor/forgot-password" &&
    pathname !== "/vendor/reset-password" &&
    pathname !== "/vendor/confirm-email";

  let res = NextResponse.next();

  // Admin section guard
  if (isOnAdmin && !isAdminLoginRoute) {
    if (!isLoggedIn) {
      res = NextResponse.redirect(new URL("/admin/login", req.nextUrl));
    } else if (role !== "admin" && role !== "superadmin") {
      res = NextResponse.redirect(new URL("/vendor/dashboard", req.nextUrl));
    }
  }

  // Vendor protected section guard
  else if (isOnVendorProtected) {
    if (!isLoggedIn) {
      res = NextResponse.redirect(new URL("/vendor/login", req.nextUrl));
    } else if (role !== "vendor") {
      res = NextResponse.redirect(new URL("/admin", req.nextUrl));
    }
  }

  // 3. Set Device ID Cookie if new
  if (isNewDevice) {
    res.cookies.set("bitehub_device_id", deviceId as string, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
  }

  return res;
});

export const config = {
  // Match all routes except static files, images, and next internal routes
  matcher: ["/((?!_next/static|_next/image|.*\\.png$).*)"],
};
