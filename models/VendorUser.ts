import mongoose, { Schema, Document, Types } from "mongoose";

export interface IVendorUser extends Document {
  vendorId: Types.ObjectId;
  email: string;
  password: string; // always a bcrypt hash
  role: "vendor";
  isActive: boolean;
  lastLoginAt?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  pendingEmail?: string;
  emailChangeToken?: string;
  emailChangeExpires?: Date;
  lastPasswordChangeAt?: Date;
  lastEmailChangeAt?: Date;
}

const VendorUserSchema = new Schema<IVendorUser>(
  {
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
      unique: true, // one login account per vendor profile
    },
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
      enum: ["vendor"],
      default: "vendor",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: {
      type: Date,
    },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpires: {
      type: Date,
    },
    pendingEmail: {
      type: String,
      lowercase: true,
      trim: true,
    },
    emailChangeToken: {
      type: String,
    },
    emailChangeExpires: {
      type: Date,
    },
    lastPasswordChangeAt: {
      type: Date,
    },
    lastEmailChangeAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        (ret as any).id = (ret as any)._id.toString();
        (ret as any).vendorId = (ret as any).vendorId?.toString();
        delete (ret as any)._id;
        delete (ret as any).__v;
        delete (ret as any).password; // never expose the hash
        delete (ret as any).resetPasswordToken; // never expose reset tokens in client JSON
        delete (ret as any).resetPasswordExpires;
        delete (ret as any).emailChangeToken; // never expose email change tokens
        delete (ret as any).emailChangeExpires;
      },
    },
  }
);

// Compound index: fast lookup by vendorId when loading vendor session
VendorUserSchema.index({ vendorId: 1 });
// Fast lookup by email during login
VendorUserSchema.index({ email: 1 });
// Fast lookup for password reset tokens
VendorUserSchema.index({ resetPasswordToken: 1 });
// Fast lookup for email change tokens
VendorUserSchema.index({ emailChangeToken: 1 });

export default mongoose.models.VendorUser ||
  mongoose.model<IVendorUser>("VendorUser", VendorUserSchema);
