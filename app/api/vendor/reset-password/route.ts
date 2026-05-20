import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import dbConnect from "@/lib/db";
import VendorUserModel from "@/models/VendorUser";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { strongPasswordSchema } from "@/lib/schemas";

const resetPasswordSchema = z.object({
  email: z.string().email(),
  token: z.string().min(1),
  password: strongPasswordSchema,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid input values" },
        { status: 400 }
      );
    }

    const { email, token, password } = parsed.data;

    await dbConnect();

    // Re-hash the token received from the user to query the database
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await VendorUserModel.findOne({
      email: email.toLowerCase(),
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Password reset link is invalid or has expired." },
        { status: 400 }
      );
    }

    // Hash the new password and update user record
    const passwordHash = await bcrypt.hash(password, 12);
    user.password = passwordHash;
    user.lastPasswordChangeAt = new Date();
    
    // Completely remove the token and expiration fields to avoid redundancy
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    await user.save();

    return NextResponse.json({
      message: "Password reset successful.",
    });
  } catch (error) {
    console.error("Reset password API error:", error);
    return NextResponse.json(
      { message: "Internal server error occurred." },
      { status: 500 }
    );
  }
}
