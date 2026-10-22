import mongoose, { Schema, Document, Types } from "mongoose"

export interface IPromoCode extends Document {
  id: string
  code: string
  title: string
  description?: string

  // ─── Scope Hierarchy (Null/Undefined = Unrestricted) ─────────────────────────
  targetSchool?: string
  targetCampus?: string
  targetVendorId?: Types.ObjectId
  targetMenuItemId?: string

  // ─── Discount Mechanics ─────────────────────────────────────────────────────
  discountType: "FIXED_AMOUNT" | "PERCENTAGE"
  discountValueInKobo: number // Flat discount in Kobo or base value
  discountPercentage?: number // 1 to 100 for percentage
  maxDiscountInKobo?: number // Maximum cap for percentage discounts
  minOrderValueInKobo?: number // Minimum food subtotal required

  // ─── Budget & Fintech Safeguards ─────────────────────────────────────────────
  budgetAllocatedInKobo: number // Total Kobo BiteHub is willing to subsidize
  budgetSpentInKobo: number // Total Kobo redeemed so far
  maxRedemptions?: number // Optional total usage cap
  currentRedemptions: number // Total times redeemed
  maxRedemptionsPerCustomer: number // Default 1

  // ─── Lifecycle ──────────────────────────────────────────────────────────────
  isActive: boolean
  startDate: Date
  endDate?: Date

  createdAt: Date
  updatedAt: Date
}

const PromoCodeSchema = new Schema<IPromoCode>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },

    targetSchool: { type: String, trim: true },
    targetCampus: { type: String, trim: true },
    targetVendorId: { type: Schema.Types.ObjectId, ref: "Vendor" },
    targetMenuItemId: { type: String, trim: true },

    discountType: {
      type: String,
      enum: ["FIXED_AMOUNT", "PERCENTAGE"],
      required: true,
      default: "FIXED_AMOUNT",
    },
    discountValueInKobo: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "{VALUE} is not an integer value",
      },
    },
    discountPercentage: {
      type: Number,
      min: 1,
      max: 100,
    },
    maxDiscountInKobo: {
      type: Number,
      min: 0,
      validate: {
        validator: (v: number | undefined) =>
          v === undefined || Number.isInteger(v),
        message: "{VALUE} is not an integer value",
      },
    },
    minOrderValueInKobo: {
      type: Number,
      min: 0,
      validate: {
        validator: (v: number | undefined) =>
          v === undefined || Number.isInteger(v),
        message: "{VALUE} is not an integer value",
      },
    },

    budgetAllocatedInKobo: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "{VALUE} is not an integer value",
      },
    },
    budgetSpentInKobo: {
      type: Number,
      default: 0,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "{VALUE} is not an integer value",
      },
    },
    maxRedemptions: {
      type: Number,
      min: 1,
    },
    currentRedemptions: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxRedemptionsPerCustomer: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },

    isActive: { type: Boolean, default: true },
    startDate: { type: Date, default: Date.now, required: true },
    endDate: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = String(ret._id)
        delete (ret as Record<string, unknown>)._id
        delete (ret as Record<string, unknown>).__v
      },
    },
  }
)

PromoCodeSchema.index({ code: 1 }, { unique: true })
PromoCodeSchema.index({ isActive: 1, startDate: 1, endDate: 1 })
PromoCodeSchema.index({ targetVendorId: 1 })
PromoCodeSchema.index({ targetCampus: 1 })

export default mongoose.models.PromoCode ||
  mongoose.model<IPromoCode>("PromoCode", PromoCodeSchema)
