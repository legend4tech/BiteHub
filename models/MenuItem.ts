import mongoose, { Schema, Document, Types } from "mongoose"

export interface IMenuItem extends Document {
  vendorId: Types.ObjectId
  name: string
  description?: string
  priceInKobo: number
  category: string
  image?: {
    url: string
    publicId: string
  }
  isAvailable: boolean
  availableFrom?: string
  availableTo?: string
  prepTimeValue?: number
  prepTimeUnit?: "minutes" | "hours" | "days"
  quantityAvailable?: number | null
  availableDays: string[]
  isPreorder: boolean
  preorderEndDate?: Date
  preorderDeliveryInfo?: string
  lowStockAlertSent?: boolean
  baseDiscoveryScore: number
  rating: number
  ratingCount: number
}

const MenuItemSchema: Schema = new Schema(
  {
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },
    name: { type: String, required: true },
    description: { type: String },
    priceInKobo: {
      type: Number,
      required: true,
      validate: {
        validator: Number.isInteger,
        message: "{VALUE} is not an integer value",
      },
    },
    category: { type: String, required: true },
    image: {
      url: { type: String },
      publicId: { type: String },
    },
    isAvailable: { type: Boolean, default: true },
    availableFrom: { type: String },
    availableTo: { type: String },
    prepTimeValue: { type: Number },
    prepTimeUnit: { type: String, enum: ["minutes", "hours", "days"] },
    quantityAvailable: { type: Number, default: null },
    availableDays: {
      type: [String],
      default: [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ],
    },
    isPreorder: {
      type: Boolean,
      default: false,
    },
    preorderEndDate: {
      type: Date,
    },
    preorderDeliveryInfo: {
      type: String,
    },
    lowStockAlertSent: {
      type: Boolean,
      default: false,
    },
    baseDiscoveryScore: {
      type: Number,
      default: 0,
    },
    rating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = String(ret._id)
        // Serialize vendorId as string for the frontend
        if (ret.vendorId) {
          ret.vendorId = String(ret.vendorId)
        }
        delete ret._id
        delete ret.__v
      },
    },
    toObject: { virtuals: true },
  }
)

// Index for fast vendor lookups
MenuItemSchema.index({ vendorId: 1, isAvailable: 1 })
MenuItemSchema.index({ category: 1, isAvailable: 1 })

export default mongoose.models.MenuItem ||
  mongoose.model<IMenuItem>("MenuItem", MenuItemSchema)
