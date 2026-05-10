import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import CredentialsProvider from "next-auth/providers/credentials";
import { CredentialsSignin } from "next-auth";
import dbConnect from "@/lib/db";
import AdminUser from "@/models/AdminUser"; 
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
            .object({ email: z.string().email(), password: z.string().min(6) })
            .safeParse(credentials);

          if (!parsedCredentials.success) {
            throw new CredentialsSignin("Invalid inputs");
          }

          const { email, password } = parsedCredentials.data;
          
          await dbConnect();
          const admin = await AdminUser.findOne({ email: email.toLowerCase() });
          
          if (!admin || !admin.isActive) {
            throw new CredentialsSignin("Invalid credentials");
          }

          const passwordsMatch = await bcrypt.compare(password, admin.password);
          
          if (!passwordsMatch) {
            throw new CredentialsSignin("Invalid credentials");
          }

          // Update last login (fire and forget to not block login)
          AdminUser.findByIdAndUpdate(admin._id, { lastLoginAt: new Date() }).exec();
          
          return {
            id: admin._id.toString(),
            name: admin.name,
            email: admin.email,
            role: admin.role,
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
