import type { NextAuthConfig } from "next-auth"

export const authConfig: NextAuthConfig = {
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days (in seconds)
  },
  pages: {
    signIn: "/admin/login",
    error: "/auth-error",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const role = auth?.user?.role
      const { pathname } = nextUrl

      // API routes always pass through to the route handler
      if (pathname.startsWith("/api")) return true

      // ── Vendor section ───────────────────────────────────────────────────────
      const isVendorLoginPage = pathname === "/vendor/login"
      const isVendorPublicPage =
        pathname === "/vendor/forgot-password" ||
        pathname === "/vendor/reset-password" ||
        pathname === "/vendor/confirm-email"
      const isVendorProtected =
        pathname.startsWith("/vendor/") &&
        !isVendorLoginPage &&
        !isVendorPublicPage

      // Redirect logged-in users away from vendor auth pages
      if ((isVendorLoginPage || isVendorPublicPage) && isLoggedIn) {
        if (role === "vendor")
          return Response.redirect(new URL("/vendor/dashboard", nextUrl))
        if (role === "vendor_manager")
          return Response.redirect(new URL("/vendor-manager", nextUrl))
        return Response.redirect(new URL("/admin", nextUrl))
      }
      // Redirect unauthenticated users to vendor login
      if (isVendorProtected && !isLoggedIn) {
        return Response.redirect(new URL("/vendor/login", nextUrl))
      }
      // Only vendors can access /vendor/* protected pages
      if (isVendorProtected && isLoggedIn && role !== "vendor") {
        return Response.redirect(new URL("/", nextUrl))
      }

      // ── Admin login page ─────────────────────────────────────────────────────
      const isAdminLoginPage = pathname === "/admin/login"

      if (isAdminLoginPage && isLoggedIn) {
        // Smart redirect based on role after login
        if (role === "vendor_manager")
          return Response.redirect(new URL("/vendor-manager", nextUrl))
        if (role === "vendor")
          return Response.redirect(new URL("/vendor/dashboard", nextUrl))
        return Response.redirect(new URL("/admin", nextUrl))
      }

      // ── Admin dashboard section (admin & superadmin only) ────────────────────
      const isAdminProtected =
        pathname.startsWith("/admin") && !isAdminLoginPage

      if (isAdminProtected && !isLoggedIn) return false // → redirects to /admin/login

      if (isAdminProtected && isLoggedIn) {
        // vendor_manager accidentally hitting /admin → send to their dashboard
        if (role === "vendor_manager")
          return Response.redirect(new URL("/vendor-manager", nextUrl))
        // vendors have no business here
        if (role === "vendor")
          return Response.redirect(new URL("/vendor/dashboard", nextUrl))
      }

      // ── Vendor-manager dashboard section (vendor_manager only) ───────────────
      const isVendorManagerLoginPage = pathname === "/vendor-manager/login"
      const isVendorManagerProtected =
        pathname.startsWith("/vendor-manager") && !isVendorManagerLoginPage

      if (isVendorManagerLoginPage && isLoggedIn) {
        if (role === "vendor_manager")
          return Response.redirect(new URL("/vendor-manager", nextUrl))
        if (role === "vendor")
          return Response.redirect(new URL("/vendor/dashboard", nextUrl))
        return Response.redirect(new URL("/admin", nextUrl))
      }

      if (isVendorManagerProtected && !isLoggedIn) {
        return Response.redirect(new URL("/vendor-manager/login", nextUrl))
      }

      if (isVendorManagerProtected && isLoggedIn) {
        // Admin/superadmin accidentally hitting /vendor-manager → send to /admin
        if (role === "admin" || role === "superadmin") {
          return Response.redirect(new URL("/admin", nextUrl))
        }
        // Regular vendors have no business here
        if (role === "vendor") {
          return Response.redirect(new URL("/vendor/dashboard", nextUrl))
        }
      }

      // Public routes and valid authenticated users → pass through
      return true
    },
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.vendorId = user.vendorId
        token.image = user.image
      }
      if (trigger === "update") {
        if (session?.name) {
          token.name = session.name
        }
        if (session?.image !== undefined) {
          token.image = session.image
        }
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.vendorId = token.vendorId as string | undefined
        session.user.image = token.image as string | undefined
        if (token.name) {
          session.user.name = token.name as string
        }
      }
      return session
    },
  },
  providers: [], // Add providers in auth.ts
}
