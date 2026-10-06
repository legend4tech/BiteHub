import mongoose, { Schema, Document, Types } from "mongoose"

export interface IOrderItem {
  menuItemId: string
  name: string
  priceInKobo: number
  quantity: number
  image?: string
}

export interface IOrder extends Document {
  orderId: string
  vendorId: Types.ObjectId
  vendorName: string
  vendorWhatsappNumber: string
  vendorPrepTime?: string
  customerId?: Types.ObjectId
  customerName: string
  customerEmail?: string
  customerPhone: string
  location: string
  items: IOrderItem[]
  notes?: string
  deliveryFeeInKobo: number
  serviceFeeInKobo: number
  platformCommissionInKobo: number
  vendorRevenueInKobo: number
  totalAmountInKobo: number
  status:
    | "pending"
    | "confirmed"
    | "preparing"
    | "ready"
    | "completed"
    | "cancelled"
  paymentMethod: "monnify" | "wallet"
  paymentStatus: "pending" | "paid" | "failed"
  monnifyReference?: string
  isDisbursed?: boolean
  expiresAt?: Date
  isFullyRated?: boolean
  isVendorRated?: boolean
  ratedItems?: string[]

  // Gamification Fields
  rewardVoucherId?: Types.ObjectId
  isRewardSponsored?: boolean
  sponsoredDiscountAmountInKobo?: number
  walletPromoAmountUsedInKobo?: number
  walletDepositAmountUsedInKobo?: number
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    menuItemId: { type: String, required: true },
    name: { type: String, required: true },
    priceInKobo: {
      type: Number,
      required: true,
      validate: {
        validator: Number.isInteger,
        message: "{VALUE} is not an integer value",
      },
    },
    quantity: { type: Number, required: true },
    image: { type: String },
  },
  { _id: false } // No separate _id for subdocuments
)

const OrderSchema = new Schema<IOrder>(
  {
    orderId: { type: String, required: true, unique: true },
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },
    vendorName: { type: String, required: true },
    vendorWhatsappNumber: { type: String, default: "" },
    vendorPrepTime: { type: String, default: "" },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
    },
    customerName: { type: String, required: true },
    customerEmail: { type: String },
    customerPhone: { type: String, required: true },
    location: { type: String, required: true },
    items: { type: [OrderItemSchema], required: true },
    notes: { type: String, default: "" },
    deliveryFeeInKobo: {
      type: Number,
      required: true,
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: "{VALUE} is not an integer value",
      },
    },
    serviceFeeInKobo: {
      type: Number,
      required: true,
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: "{VALUE} is not an integer value",
      },
    },
    platformCommissionInKobo: {
      type: Number,
      required: true,
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: "{VALUE} is not an integer value",
      },
    },
    vendorRevenueInKobo: {
      type: Number,
      required: true,
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: "{VALUE} is not an integer value",
      },
    },
    totalAmountInKobo: {
      type: Number,
      required: true,
      validate: {
        validator: Number.isInteger,
        message: "{VALUE} is not an integer value",
      },
    },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "preparing",
        "ready",
        "completed",
        "cancelled",
      ],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["monnify", "wallet"],
      default: "monnify",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    monnifyReference: { type: String },
    isDisbursed: { type: Boolean, default: false },
    expiresAt: { type: Date },
    isFullyRated: { type: Boolean, default: false },
    isVendorRated: { type: Boolean, default: false },
    ratedItems: { type: [String], default: [] },

    // Gamification Fields
    rewardVoucherId: { type: Schema.Types.ObjectId, ref: "RewardVoucher" },
    isRewardSponsored: { type: Boolean, default: false },
    sponsoredDiscountAmountInKobo: {
      type: Number,
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: "{VALUE} is not an integer value",
      },
    },
    walletPromoAmountUsedInKobo: {
      type: Number,
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: "{VALUE} is not an integer value",
      },
    },
    walletDepositAmountUsedInKobo: {
      type: Number,
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: "{VALUE} is not an integer value",
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = String(ret._id)
        ret.vendorId = String(ret.vendorId)
        delete ret._id
        delete ret.__v
      },
    },
  }
)

// orderId is already indexed via unique:true above.
//
// Compound index: vendorId → status → createdAt
// Covers ALL vendor queries in one index:
//   - Stats aggregation:  $match vendorId  → $group by status
//   - Orders list:        $match vendorId  → $sort  by createdAt
//   - Filtered list:      $match vendorId + status → $sort by createdAt
// MongoDB uses the leftmost prefix, so { vendorId } and { vendorId, status }
// queries are also covered without a separate index.
OrderSchema.index({ vendorId: 1, status: 1, createdAt: -1 })

// Compound index for Customer Dashboard
// Covers counting orders by email and fetching recent orders sorted by date
OrderSchema.index({ customerEmail: 1, createdAt: -1 })

// Compound index for Admin Analytics
// Covers all analytics queries filtering by paymentStatus + date range:
//   - paid orders KPIs: { paymentStatus: "paid", createdAt: { $gte } }
//   - all-orders queries: { createdAt: { $gte } } — uses createdAt suffix
//   - top vendors agg: { paymentStatus: "paid", createdAt: dateFilter }
//   - zone agg: { createdAt: dateFilter }
// Eliminates full collection scans on every analytics page load.
OrderSchema.index({ paymentStatus: 1, createdAt: -1 })

// Gamification Analytics index for BHC Spent
OrderSchema.index({ status: 1, walletPromoAmountUsedInKobo: -1 })

export default mongoose.models.Order ||
  mongoose.model<IOrder>("Order", OrderSchema)
