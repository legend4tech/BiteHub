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
          if (role === "vendor" && vendorId) {
            const vendor = await VendorModel.findById(vendorId).select("name").lean();
            if (vendor) displayName = (vendor as any).name;
          }

          return {
            id: user._id.toString(),
            name: displayName,
            email: user.email,
            role: role,
            vendorId: vendorId,
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
});
