import mongoose, { Schema, Document } from "mongoose"

export interface ICustomer extends Document {
  name: string
  username?: string // Used for wallet transfers and profile links
  email: string
  phone: string
  password?: string // Optional because first-time guests might not have one immediately
  referralCode: string
  referredBy?: string
  isActive: boolean
  receivesMarketing: boolean
  school?: string // Made optional for backward compatibility with older users
  campus?: string
  preferredLandmark?: string
  preferredSubLandmark?: string
  preferredExactLocation?: string
  image?: string
  imagePublicId?: string
  lastLoginAt?: Date
  lastOrderAt?: Date
  sentReEngagementAt?: Date
  createdAt: Date
  updatedAt: Date

  // Security / Account Recovery
  pendingEmail?: string
  emailChangeToken?: string
  emailChangeExpires?: Date
  lastPasswordChangeAt?: Date
  resetPasswordToken?: string
  resetPasswordExpires?: Date
  acceptedTermsVersion?: string
  acceptedTermsAt?: Date
}

const CustomerSchema = new Schema<ICustomer>(
  {
    name: { type: String, required: true },
    username: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, required: true },
    password: { type: String }, // Hashed password
    referralCode: { type: String, required: true, unique: true },
    referredBy: { type: String }, // The referralCode of the user who referred them
    isActive: { type: Boolean, default: true },
    receivesMarketing: { type: Boolean, default: true },
    school: { type: String },
    campus: { type: String },
    preferredLandmark: { type: String },
    preferredSubLandmark: { type: String },
    preferredExactLocation: { type: String },
    image: { type: String },
    imagePublicId: { type: String },
    lastLoginAt: { type: Date },
    lastOrderAt: { type: Date },
    sentReEngagementAt: { type: Date },

    // Security / Account Recovery
    pendingEmail: { type: String, lowercase: true, trim: true },
    emailChangeToken: { type: String },
    emailChangeExpires: { type: Date },
    lastPasswordChangeAt: { type: Date },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    acceptedTermsVersion: { type: String, default: "" },
    acceptedTermsAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = String(ret._id)
        delete ret._id
        delete ret.__v
        delete ret.password // Ensure password is never exposed in JSON output
        delete ret.emailChangeToken
        delete ret.resetPasswordToken
      },
    },
  }
)

// Analytics: new customers count for a date range
CustomerSchema.index({ createdAt: -1 })

// Gamification / Re-engagement: find dormant active customers
CustomerSchema.index({ lastOrderAt: 1, isActive: 1 })

export default mongoose.models.Customer ||
  mongoose.model<ICustomer>("Customer", CustomerSchema)
