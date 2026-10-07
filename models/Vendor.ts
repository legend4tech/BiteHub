import mongoose, { Schema, Document } from "mongoose"

export interface IVendor extends Document {
  name: string
  slug: string
  description: string
  category: string
  tags: string[]
  whatsappNumber: string
  school: string
  campus: string
  isActive: boolean
  isOpen: boolean
  defaultDeliveryFeeInKobo: number
  prepTime: string
  image?: {
    url: string
    publicId: string
  }
  monnifySubAccountCode?: string
  monnifyBankCode?: string
  monnifyAccountNumber?: string
  monnifyIntegrationStatus?: "pending" | "active"
  monnifyTotalDisbursedInKobo?: number
  pendingWalletBalanceInKobo?: number
  walletTotalDisbursedInKobo?: number
  processedDisbursementRefs?: string[]
  processedSettlementRefs?: string[]
  isDisbursing?: boolean
  lastBankUpdateAt?: Date
  bankUpdateOtp?: string
  bankUpdateOtpExpiry?: Date
  bankUpdateOtpAttempts?: number
  isFeatured?: boolean
  rating?: number
  ratingCount?: number

  landmarkOverrides?: {
    landmarkId: mongoose.Types.ObjectId
    feeInKobo: number
  }[]
  subLandmarkOverrides?: {
    subLandmarkId: mongoose.Types.ObjectId
    feeInKobo: number
  }[]

  // Virtuals
  initials: string
  tagline: string
  location: string

  onboardedBy?: mongoose.Types.ObjectId
  isManagedByBiteHub?: boolean
}

const VendorSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    tags: { type: [String], default: [] },
    whatsappNumber: { type: String, required: true },
    school: { type: String, required: true },
    campus: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    isOpen: { type: Boolean, default: true },
    defaultDeliveryFeeInKobo: { type: Number, default: 0 },
    prepTime: { type: String, default: "" },
    image: {
      url: { type: String },
      publicId: { type: String },
    },
    monnifySubAccountCode: { type: String, default: "" },
    monnifyBankCode: { type: String, default: "" },
    monnifyAccountNumber: { type: String, default: "" },
    monnifyIntegrationStatus: {
      type: String,
      enum: ["pending", "active"],
      default: "pending",
    },
    monnifyTotalDisbursedInKobo: { type: Number, default: 0 },
    pendingWalletBalanceInKobo: { type: Number, default: 0 },
    walletTotalDisbursedInKobo: { type: Number, default: 0 },
    lastBankUpdateAt: { type: Date },
    bankUpdateOtp: { type: String },
    bankUpdateOtpExpiry: { type: Date },
    bankUpdateOtpAttempts: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    rating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    landmarkOverrides: [
      {
        landmarkId: {
          type: Schema.Types.ObjectId,
          ref: "Landmark",
          required: true,
        },
        feeInKobo: { type: Number, required: true },
        _id: false,
      },
    ],
    subLandmarkOverrides: [
      {
        subLandmarkId: {
          type: Schema.Types.ObjectId,
          ref: "SubLandmark",
          required: true,
        },
        feeInKobo: { type: Number, required: true },
        _id: false,
      },
    ],
    onboardedBy: {
      type: Schema.Types.ObjectId,
      ref: "AdminUser",
    },
    isManagedByBiteHub: { type: Boolean, default: false },
    processedDisbursementRefs: {
      type: [String],
      default: [],
    },
    processedSettlementRefs: {
      type: [String],
      default: [],
    },
    isDisbursing: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = String(ret._id)
        delete ret._id
        delete ret.__v
      },
    },
    toObject: { virtuals: true },
  }
)

// Virtuals for UI (Fabricated data)
VendorSchema.virtual("initials").get(function (this: IVendor) {
  const name = this.name
  return name
    ? name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : ""
})
VendorSchema.virtual("tagline").get(function (this: IVendor) {
  return this.description || "The best food on campus"
})
VendorSchema.virtual("location").get(function (this: IVendor) {
  return this.campus || "Main Campus"
})

// Indexes for high-performance querying
VendorSchema.index({ school: 1, campus: 1, isActive: 1 })
VendorSchema.index({ name: "text", category: "text" })
// Analytics: new vendors count for a date range
VendorSchema.index({ createdAt: -1 })

export default mongoose.models.Vendor ||
  mongoose.model<IVendor>("Vendor", VendorSchema)
