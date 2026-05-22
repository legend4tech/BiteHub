import type { NextAuthConfig } from "next-auth";

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
      const isLoggedIn = !!auth?.user;
      const role = (auth?.user as any)?.role;
      const { pathname } = nextUrl;

      // API routes always pass through to the route handler
      if (pathname.startsWith("/api")) return true;

      // ── Vendor section ───────────────────────────────────────────────────────
      const isVendorLoginPage = pathname === "/vendor/login";
      const isVendorPublicPage =
        pathname === "/vendor/forgot-password" ||
        pathname === "/vendor/reset-password" ||
        pathname === "/vendor/confirm-email";
      const isVendorProtected =
        pathname.startsWith("/vendor/") && !isVendorLoginPage && !isVendorPublicPage;

      // Redirect logged-in users away from vendor auth pages
      if ((isVendorLoginPage || isVendorPublicPage) && isLoggedIn) {
        return Response.redirect(new URL(
          role === "vendor" ? "/vendor/dashboard" : "/admin",
          nextUrl
        ));
      }
      // Redirect unauthenticated users to vendor login
      if (isVendorProtected && !isLoggedIn) {
        return Response.redirect(new URL("/vendor/login", nextUrl));
      }

      // ── Admin section ────────────────────────────────────────────────────────
      const isAdminLoginPage = pathname === "/admin/login";
      const isAdminProtected = pathname.startsWith("/admin") && !isAdminLoginPage;

      // Redirect logged-in users away from admin login
      if (isAdminLoginPage && isLoggedIn) {
        return Response.redirect(new URL(
          role === "vendor" ? "/vendor/dashboard" : "/admin",
          nextUrl
        ));
      }
      // Unauthenticated on admin → NextAuth redirects to /admin/login
      if (isAdminProtected && !isLoggedIn) return false;

      // Public routes and authenticated users → pass through; proxy.ts handles role redirects
      return true;
    },
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.vendorId = (user as any).vendorId;
        token.image = (user as any).image;
      }
      if (trigger === "update") {
        if (session?.name) {
          token.name = session.name;
        }
        if (session?.image !== undefined) {
          token.image = session.image;
        }
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role as string;
        (session.user as any).vendorId = token.vendorId as string | undefined;
        session.user.image = token.image as string | undefined;
        if (token.name) {
          session.user.name = token.name as string;
        }
      }
      return session;
    },
  },
  providers: [], // Add providers in auth.ts
};
