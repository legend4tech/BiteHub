import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";
import { globalRateLimiter, strictRateLimiter, isRateLimitingEnabled } from "@/lib/rate-limit";

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

  // Admin section guard
  if (isOnAdmin && !isAdminLoginRoute) {
    if (!isLoggedIn) {
      return Response.redirect(new URL("/admin/login", req.nextUrl));
    }
    if (role !== "admin" && role !== "superadmin") {
      return Response.redirect(new URL("/vendor/dashboard", req.nextUrl));
    }
  }

  // Vendor protected section guard
  if (isOnVendorProtected) {
    if (!isLoggedIn) {
      return Response.redirect(new URL("/vendor/login", req.nextUrl));
    }
    if (role !== "vendor") {
      return Response.redirect(new URL("/admin", req.nextUrl));
    }
  }

  // 3. Pass request to next handler
  return NextResponse.next();
});

export const config = {
  // Match all routes except static files, images, and next internal routes
  matcher: ["/((?!_next/static|_next/image|.*\\.png$).*)"],
};
