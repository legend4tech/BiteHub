import mongoose, { Schema, Document, Types } from "mongoose";

export interface IVendorUser extends Document {
  vendorId: Types.ObjectId;
  email: string;
  password: string; // always a bcrypt hash
  role: "vendor";
  isActive: boolean;
  lastLoginAt?: Date;
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
      },
    },
  }
);

// Compound index: fast lookup by vendorId when loading vendor session
VendorUserSchema.index({ vendorId: 1 });
// Fast lookup by email during login
VendorUserSchema.index({ email: 1 });

export default mongoose.models.VendorUser ||
  mongoose.model<IVendorUser>("VendorUser", VendorUserSchema);
