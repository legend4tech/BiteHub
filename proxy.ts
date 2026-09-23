import NextAuth from "next-auth"
import { authConfig } from "./auth.config"
import { NextResponse } from "next/server"
import { strictIpRateLimiter, isRateLimitingEnabled } from "@/lib/rate-limit"

const { auth } = NextAuth(authConfig)

export default auth(async (req) => {
  // 0. Maintenance Mode Check
  if (process.env.MAINTENANCE_MODE === "true") {
    const path = req.nextUrl.pathname

    // If it's an API route, return 503
    if (path.startsWith("/api/")) {
      return new NextResponse(
        JSON.stringify({
          error: "Service Unavailable",
          message: "BiteHub is currently undergoing maintenance.",
        }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      )
    }

    // Rewrite all other requests to the maintenance page (unless they are already going there)
    if (path !== "/maintenance") {
      return NextResponse.rewrite(new URL("/maintenance", req.url))
    }
  }

  let deviceId = req.cookies.get("bitehub_device_id")?.value
  let isNewDevice = false
  if (!deviceId) {
    deviceId = crypto.randomUUID()
    isNewDevice = true
  }

  // 1. Rate Limiting Logic

  // Move auth extraction up so we can use it for rate limiting
  const session = req.auth
  const userId = session?.user?.id

  if (isRateLimitingEnabled) {
    const ip =
      (req as { ip?: string }).ip ??
      req.headers.get("x-forwarded-for") ??
      "127.0.0.1"
    const path = req.nextUrl.pathname

    // Only rate-limit auth mutations (signin, callback, signout).
    // GET routes like /session, /csrf, /providers are called on every page load
    // and must NOT hit Redis or they will burn through the free-tier monthly quota.
    const isAuthRoute = path.startsWith("/api/auth/") && req.method !== "GET"
    const isOrderRoute = path.startsWith("/api/orders")
    const isWalletRoute = path.startsWith("/api/wallet")
    const isCustomerRoute = path.startsWith("/api/customer")

    // Public vendor auth routes (forgot-password, reset-password, confirm-email) have no
    // session requirement so they can't rely on the session-based auth check in their handlers.
    // /api/customer/* equivalents are already covered by isCustomerRoute below.
    const isPublicVendorAuthRoute =
      req.method !== "GET" &&
      (path.startsWith("/api/vendor/forgot-password") ||
        path.startsWith("/api/vendor/reset-password") ||
        path.startsWith("/api/vendor/account/confirm-email"))

    // Only rate limit mutations (POST/PUT/DELETE) on specific high-risk routes.
    // GET requests (reading data) bypass Redis completely to save quota.
    // NOTE: /api/feedback is intentionally excluded — feedback/route.ts already
    // calls strictRateLimiter internally (10/min), which is tighter than the
    // 20/min proxy limit. Including it here would burn 2 Redis commands per request.
    const isHighRiskMutation =
      req.method !== "GET" && (isOrderRoute || isWalletRoute || isCustomerRoute)

    if (isAuthRoute || isHighRiskMutation || isPublicVendorAuthRoute) {
      // 1. Prioritize User ID, then the cookie-sourced device ID, then IP.
      // NOTE: deviceId above may be a freshly generated UUID (for new devices).
      // We must NOT use that as an identifier — it changes every request for
      // cookie-less clients (e.g. bots/curl), making each hit a separate bucket.
      // Only use a deviceId that actually came from the cookie; fall back to IP.
      const cookieDeviceId = req.cookies.get("bitehub_device_id")?.value
      const rawIdentifier = userId || cookieDeviceId || ip

      // 2. Hash it to protect privacy using Edge-compatible Web Crypto
      const hashBuffer = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(rawIdentifier)
      )
      const hashedIdentifier = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")

      try {
        const limitResult = await strictIpRateLimiter.limit(
          `strict_masked_${hashedIdentifier}`
        )

        if (!limitResult.success) {
          return NextResponse.json(
            {
              error: "Too Many Requests",
              message: "Rate limit exceeded. Please try again later.",
            },
            {
              status: 429,
              headers: {
                "X-RateLimit-Limit": limitResult.limit.toString(),
                "X-RateLimit-Remaining": limitResult.remaining.toString(),
                "X-RateLimit-Reset": limitResult.reset.toString(),
              },
            }
          )
        }
      } catch (err) {
        // Fail open — Redis unreachable. Log and continue rather than crashing
        // the middleware (which would break CSRF, auth routing, and all page loads).
        console.warn("[proxy] Rate limiter unavailable, failing open:", err)
      }
    }
  }

  // 2. Auth guard — enforce role-based access at the edge to prevent flash-of-protected-content
  const { pathname } = req.nextUrl
  const isLoggedIn = !!session?.user
  const role = session?.user?.role

  const isOnAdmin = pathname.startsWith("/admin")
  const isAdminLoginRoute = pathname === "/admin/login"
  const isOnVendorManager = pathname.startsWith("/vendor-manager")
  const isVendorManagerLoginRoute = pathname === "/vendor-manager/login"
  const isOnVendorProtected =
    pathname.startsWith("/vendor/") &&
    pathname !== "/vendor/login" &&
    pathname !== "/vendor/forgot-password" &&
    pathname !== "/vendor/reset-password" &&
    pathname !== "/vendor/confirm-email"
  const isOnCustomerProtected =
    pathname.startsWith("/customer/") &&
    pathname !== "/customer/login" &&
    pathname !== "/customer/signup" &&
    pathname !== "/customer/forgot-password" &&
    pathname !== "/customer/reset-password"

  let res = NextResponse.next()

  // Admin section guard
  if (isOnAdmin && !isAdminLoginRoute) {
    if (!isLoggedIn) {
      res = NextResponse.redirect(new URL("/admin/login", req.nextUrl))
    } else if (role !== "admin" && role !== "superadmin") {
      if (role === "vendor_manager") {
        res = NextResponse.redirect(new URL("/vendor-manager", req.nextUrl))
      } else if (role === "vendor") {
        res = NextResponse.redirect(new URL("/vendor/dashboard", req.nextUrl))
      } else {
        res = NextResponse.redirect(new URL("/customer/dashboard", req.nextUrl))
      }
    }
  }

  // Vendor Manager section guard
  else if (isOnVendorManager && !isVendorManagerLoginRoute) {
    if (!isLoggedIn) {
      res = NextResponse.redirect(new URL("/vendor-manager/login", req.nextUrl))
    } else if (role !== "vendor_manager") {
      if (role === "admin" || role === "superadmin") {
        res = NextResponse.redirect(new URL("/admin", req.nextUrl))
      } else if (role === "vendor") {
        res = NextResponse.redirect(new URL("/vendor/dashboard", req.nextUrl))
      } else {
        res = NextResponse.redirect(new URL("/customer/dashboard", req.nextUrl))
      }
    }
  }

  // Vendor protected section guard
  else if (isOnVendorProtected) {
    if (!isLoggedIn) {
      res = NextResponse.redirect(new URL("/vendor/login", req.nextUrl))
    } else if (role !== "vendor") {
      if (role === "vendor_manager") {
        res = NextResponse.redirect(new URL("/vendor-manager", req.nextUrl))
      } else if (role === "admin" || role === "superadmin") {
        res = NextResponse.redirect(new URL("/admin", req.nextUrl))
      } else {
        res = NextResponse.redirect(new URL("/customer/dashboard", req.nextUrl))
      }
    }
  }

  // Customer protected section guard
  else if (isOnCustomerProtected) {
    if (!isLoggedIn) {
      res = NextResponse.redirect(new URL("/customer/login", req.nextUrl))
    } else if (role !== "customer") {
      if (role === "vendor_manager") {
        res = NextResponse.redirect(new URL("/vendor-manager", req.nextUrl))
      } else if (role === "admin" || role === "superadmin") {
        res = NextResponse.redirect(new URL("/admin", req.nextUrl))
      } else {
        res = NextResponse.redirect(new URL("/vendor/dashboard", req.nextUrl))
      }
    }
  }

  // Redirect logged-in users away from auth pages
  // (We allow them to visit forgot-password and reset-password in case they click an email link while still having an active session)
  else if (
    isLoggedIn &&
    (isAdminLoginRoute ||
      isVendorManagerLoginRoute ||
      pathname === "/vendor/login" ||
      pathname === "/customer/login" ||
      pathname === "/customer/signup")
  ) {
    if (role === "admin" || role === "superadmin") {
      res = NextResponse.redirect(new URL("/admin", req.nextUrl))
    } else if (role === "vendor_manager") {
      res = NextResponse.redirect(new URL("/vendor-manager", req.nextUrl))
    } else if (role === "vendor") {
      res = NextResponse.redirect(new URL("/vendor/dashboard", req.nextUrl))
    } else {
      res = NextResponse.redirect(new URL("/customer/dashboard", req.nextUrl))
    }
  }

  // 3. Set Device ID Cookie if new
  if (isNewDevice) {
    res.cookies.set("bitehub_device_id", deviceId as string, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    })
  }

  return res
})

export const config = {
  // Match all routes except static files, images, and next internal routes
  matcher: ["/((?!_next/static|_next/image|.*\\.png$).*)"],
}
