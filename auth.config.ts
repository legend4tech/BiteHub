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
      // Defer all routing logic to proxy.ts as per the contributor guide
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
