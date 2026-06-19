import mongoose, { Schema, Document, Types } from "mongoose"

export interface IOrderItem {
  menuItemId: string
  name: string
  price: number
  quantity: number
}

export interface IOrder extends Document {
  orderId: string
  vendorId: Types.ObjectId
  vendorName: string
  vendorWhatsappNumber: string
  vendorPrepTime?: string
  customerName: string
  customerEmail?: string
  customerPhone: string
  location: string
  items: IOrderItem[]
  notes?: string
  deliveryFee: number
  serviceFee: number
  platformCommission: number
  vendorRevenue: number
  totalAmount: number
  status:
    | "pending"
    | "confirmed"
    | "preparing"
    | "ready"
    | "completed"
    | "cancelled"
  paymentMethod: "monnify"
  paymentStatus: "pending" | "paid" | "failed"
  monnifyReference?: string
  isDisbursed?: boolean
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    menuItemId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
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
    customerName: { type: String, required: true },
    customerEmail: { type: String },
    customerPhone: { type: String, required: true },
    location: { type: String, required: true },
    items: { type: [OrderItemSchema], required: true },
    notes: { type: String, default: "" },
    deliveryFee: { type: Number, required: true, default: 0 },
    serviceFee: { type: Number, required: true, default: 0 },
    platformCommission: { type: Number, required: true, default: 0 },
    vendorRevenue: { type: Number, required: true, default: 0 },
    totalAmount: { type: Number, required: true },
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
      enum: ["monnify"],
      default: "monnify",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    monnifyReference: { type: String },
    isDisbursed: { type: Boolean, default: false },
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

export default mongoose.models.Order ||
  mongoose.model<IOrder>("Order", OrderSchema)
