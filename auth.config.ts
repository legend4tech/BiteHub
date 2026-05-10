import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days (in seconds)
  },
  pages: {
    signIn: "/admin/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnAdmin = nextUrl.pathname.startsWith("/admin");
      const isLoginRoute = nextUrl.pathname === "/admin/login";
      const isOnVendor = nextUrl.pathname === "/vendor" || nextUrl.pathname.startsWith("/vendor/");
      const isVendorLoginRoute = nextUrl.pathname === "/vendor/login";

      // Allow API routes to be handled by the route itself
      if (nextUrl.pathname.startsWith("/api")) {
        return true;
      }

      if (isOnAdmin) {
        if (isLoginRoute) {
          if (isLoggedIn) {
            // Redirect to admin dashboard if already logged in
            return Response.redirect(new URL("/admin", nextUrl));
          }
          // Allow unauthenticated users to see the login page
          return true;
        }

        if (!isLoggedIn) {
          // Redirect unauthenticated users to login
          return false;
        }
        
        // Logged in user accessing /admin routes
        return true;
      }

      if (isOnVendor) {
        if (isVendorLoginRoute) {
          if (isLoggedIn) {
            return Response.redirect(new URL("/vendor/dashboard", nextUrl));
          }
          return true;
        }

        if (!isLoggedIn) {
          return Response.redirect(new URL("/vendor/login", nextUrl));
        }

        // Only allow vendors (and possibly admins if needed, but for now restrict to vendors)
        // NextAuth authorized callback doesn't have full session token easily without typing, 
        // but we'll allow standard isLoggedIn. More strict checks can be in API or pages.
        return true;
      }

      // Default allow for public routes (e.g. landing page, vendor store view)
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.vendorId = (user as any).vendorId;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role as string;
        (session.user as any).vendorId = token.vendorId as string | undefined;
      }
      return session;
    },
  },
  providers: [], // Add providers in auth.ts
};
