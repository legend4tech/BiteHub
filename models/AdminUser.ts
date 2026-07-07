import mongoose, { Schema, Document } from "mongoose"

export interface IAdminUser extends Document {
  name: string
  email: string
  password: string
  role: "superadmin" | "admin" | "vendor_manager"
  isActive: boolean
  lastLoginAt?: Date
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
      enum: ["superadmin", "admin", "vendor_manager"],
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
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = String(ret._id)
        delete ret._id
        delete ret.__v
        delete ret.password // never expose the hash
      },
    },
  }
)

export default mongoose.models.AdminUser ||
  mongoose.model<IAdminUser>("AdminUser", AdminUserSchema)
