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
      const role = (auth?.user as any)?.role;
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
            if (role === "vendor") {
              return Response.redirect(new URL("/vendor/dashboard", nextUrl));
            }
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
        
        // Block vendors from admin pages
        if (role !== "admin" && role !== "superadmin") {
           return Response.redirect(new URL("/vendor/dashboard", nextUrl));
        }

        // Logged in user accessing /admin routes
        return true;
      }

      if (isOnVendor) {
        if (isVendorLoginRoute) {
          if (isLoggedIn) {
            if (role === "admin" || role === "superadmin") {
              return Response.redirect(new URL("/admin", nextUrl));
            }
            return Response.redirect(new URL("/vendor/dashboard", nextUrl));
          }
          return true;
        }

        if (!isLoggedIn) {
          return Response.redirect(new URL("/vendor/login", nextUrl));
        }

        // Only allow vendors on vendor pages
        if (role !== "vendor") {
           return Response.redirect(new URL("/admin", nextUrl));
        }

        return true;
      }

      // Default allow for public routes (e.g. landing page, vendor store view)
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
