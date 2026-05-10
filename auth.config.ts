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

      // Default allow for public routes (e.g. vendors view, etc)
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role as string;
      }
      return session;
    },
  },
  providers: [], // Add providers in auth.ts
};
