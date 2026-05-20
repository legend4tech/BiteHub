import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import CredentialsProvider from "next-auth/providers/credentials";
import { CredentialsSignin } from "next-auth";
import dbConnect from "@/lib/db";
import AdminUser from "@/models/AdminUser"; 
import VendorUserModel from "@/models/VendorUser";
import VendorModel from "@/models/Vendor";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { strictRateLimiter, isRateLimitingEnabled } from "@/lib/rate-limit";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      async authorize(credentials) {
        try {
          const parsedCredentials = z
            .object({ 
              email: z.string().email(), 
              password: z.string().min(6),
              loginType: z.enum(["admin", "vendor"]).optional()
            })
            .safeParse(credentials);

          if (!parsedCredentials.success) {
            throw new CredentialsSignin("Invalid inputs");
          }

          const { email, password, loginType } = parsedCredentials.data;
          
          if (isRateLimitingEnabled) {
            const { success, reset } = await strictRateLimiter.limit(`login_email_${email.toLowerCase()}`);
            if (!success) {
              const seconds = Math.ceil((reset - Date.now()) / 1000);
              if (seconds < 60) {
                throw new CredentialsSignin(`Too Many Requests, try again in ${seconds} seconds`);
              } else {
                const minutes = Math.ceil(seconds / 60);
                throw new CredentialsSignin(`Too Many Requests, try again in ${minutes} minute${minutes > 1 ? 's' : ''}`);
              }
            }
          }

          await dbConnect();
          
          let user = null;
          let role = "";
          let vendorId = undefined;

          // Prevent conflicts by checking explicit loginType
          if (loginType === "vendor") {
            user = await VendorUserModel.findOne({ email: email.toLowerCase() });
            role = "vendor";
            if (user) vendorId = user.vendorId.toString();
          } else if (loginType === "admin") {
            user = await AdminUser.findOne({ email: email.toLowerCase() });
            role = user?.role || "admin";
          } else {
            // Fallback
            user = await AdminUser.findOne({ email: email.toLowerCase() });
            role = user?.role || "admin";
            if (!user) {
              user = await VendorUserModel.findOne({ email: email.toLowerCase() });
              role = "vendor";
              if (user) vendorId = user.vendorId.toString();
            }
          }

          if (!user || !user.isActive) {
            throw new CredentialsSignin("Invalid credentials");
          }

          const passwordsMatch = await bcrypt.compare(password, user.password);
          
          if (!passwordsMatch) {
            throw new CredentialsSignin("Invalid credentials");
          }

          // Update last login (fire and forget)
          if (role === "admin" || role === "superadmin") {
            AdminUser.findByIdAndUpdate(user._id, { lastLoginAt: new Date() }).exec();
          } else {
            VendorUserModel.findByIdAndUpdate(user._id, { lastLoginAt: new Date() }).exec();
          }
          
          // Fetch the store name for vendor logins
          let displayName = user.name || user.email;
          let image = undefined;
          if (role === "vendor" && vendorId) {
            const vendor = await VendorModel.findById(vendorId).select("name image").lean();
            if (vendor) {
              displayName = (vendor as any).name;
              image = (vendor as any).image?.url;
            }
          }

          return {
            id: user._id.toString(),
            name: displayName,
            email: user.email,
            role: role,
            vendorId: vendorId,
            image: image,
          };
        } catch (error) {
          if (error instanceof CredentialsSignin) {
            throw error;
          }
          console.error("Auth error:", error);
          throw new CredentialsSignin("An error occurred during authentication.");
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger, session }) {
      // 1. Execute base logic from authConfig (which sets token.id, etc. on initial sign in)
      let newToken = token;
      if (authConfig.callbacks?.jwt) {
        newToken = (await authConfig.callbacks.jwt({ token, user, trigger, session })) || token;
      }

      // 2. Cross-check against the DB for stateless token invalidation (Node.js runtime only)
      if (newToken.role === "vendor" && newToken.id) {
        try {
          await dbConnect();
          const dbUser = await VendorUserModel.findById(newToken.id).select("lastPasswordChangeAt isActive").lean();

          if (!dbUser || !dbUser.isActive) {
            // User no longer exists or is deactivated
            return null as any; 
          }

          if (dbUser.lastPasswordChangeAt && newToken.iat) {
            const passwordChangedAtSeconds = Math.floor(dbUser.lastPasswordChangeAt.getTime() / 1000);
            if (passwordChangedAtSeconds > newToken.iat) {
              // The password was changed AFTER this token was issued. 
              // Returning null instantly destroys the token across all devices holding an old cookie.
              return null as any;
            }
          }
        } catch (error) {
          console.error("Session DB validation error:", error);
        }
      }

      return newToken;
    },
  },
});
