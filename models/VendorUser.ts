import mongoose, { Schema, Document, Types } from "mongoose"

export interface IVendorUser extends Document {
  vendorId: Types.ObjectId
  email: string
  password: string // always a bcrypt hash
  role: "vendor"
  isActive: boolean
  lastLoginAt?: Date
  resetPasswordToken?: string
  resetPasswordExpires?: Date
  pendingEmail?: string
  emailChangeToken?: string
  emailChangeExpires?: Date
  lastPasswordChangeAt?: Date
  lastEmailChangeAt?: Date
  acceptedTermsVersion?: string
  acceptedTermsAt?: Date
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
    acceptedTermsVersion: {
      type: String,
      default: "",
    },
    acceptedTermsAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        const r = ret as Record<string, unknown>
        r.id = String(r._id)
        if (r.vendorId) {
          r.vendorId = String(r.vendorId)
        }
        delete r._id
        delete r.__v
        delete r.password // never expose the hash
        delete r.resetPasswordToken // never expose reset tokens in client JSON
        delete r.resetPasswordExpires
        delete r.emailChangeToken // never expose email change tokens
        delete r.emailChangeExpires
      },
    },
  }
)

// Fast lookup for password reset tokens
VendorUserSchema.index({ resetPasswordToken: 1 })
// Fast lookup for email change tokens
VendorUserSchema.index({ emailChangeToken: 1 })

export default mongoose.models.VendorUser ||
  mongoose.model<IVendorUser>("VendorUser", VendorUserSchema)
