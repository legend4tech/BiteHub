import mongoose, { Schema, Document } from "mongoose";

export interface IAdminUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "superadmin" | "admin";
  isActive: boolean;
  lastLoginAt?: Date;
}

const AdminUserSchema = new Schema<IAdminUser>(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      // never returned in API responses — stripped in serializers
    },
    role: {
      type: String,
      enum: ["superadmin", "admin"],
      default: "admin",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        (ret as any).id = (ret as any)._id.toString();
        delete (ret as any)._id;
        delete (ret as any).__v;
        delete (ret as any).password; // never expose the hash
      },
    },
  }
);




export default mongoose.models.AdminUser ||
  mongoose.model<IAdminUser>("AdminUser", AdminUserSchema);
