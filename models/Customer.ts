import mongoose, { Schema, Document } from "mongoose"

export interface ICustomer extends Document {
  name: string
  email: string
  phone: string
  password?: string // Optional because first-time guests might not have one immediately
  referralCode: string
  referredBy?: string
  orderCount: number
  isActive: boolean
  school?: string // Made optional for backward compatibility with older users
  campus?: string
  preferredLandmark?: string
  preferredSubLandmark?: string
  preferredLocation?: string
  preferredExactLocation?: string
  lastLoginAt?: Date
  createdAt: Date
  updatedAt: Date
}

const CustomerSchema = new Schema<ICustomer>(
  {
    name: { type: String, required: true },
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
    orderCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    school: { type: String },
    campus: { type: String },
    preferredLandmark: { type: String },
    preferredSubLandmark: { type: String },
    preferredLocation: { type: String },
    preferredExactLocation: { type: String },
    lastLoginAt: { type: Date },
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
      },
    },
  }
)

export default mongoose.models.Customer ||
  mongoose.model<ICustomer>("Customer", CustomerSchema)
