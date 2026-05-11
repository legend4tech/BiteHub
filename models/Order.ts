import mongoose, { Schema, Document, Types } from "mongoose";

export interface IOrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface IOrder extends Document {
  orderId: string;
  vendorId: Types.ObjectId;
  vendorName: string;
  vendorWhatsappNumber: string;
  customerName: string;
  customerPhone: string;
  items: IOrderItem[];
  notes?: string;
  totalAmount: number;
  status: "pending" | "confirmed" | "preparing" | "ready" | "completed" | "cancelled";
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    menuItemId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
  },
  { _id: false } // No separate _id for subdocuments
);

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
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    items: { type: [OrderItemSchema], required: true },
    notes: { type: String, default: "" },
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "preparing", "ready", "completed", "cancelled"],
      default: "pending",
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = String(ret._id);
        ret.vendorId = String(ret.vendorId);
        delete ret._id;
        delete ret.__v;
      },
    },
  }
);

// orderId is already indexed via unique:true above.
//
// Compound index: vendorId → status → createdAt
// Covers ALL vendor queries in one index:
//   - Stats aggregation:  $match vendorId  → $group by status
//   - Orders list:        $match vendorId  → $sort  by createdAt
//   - Filtered list:      $match vendorId + status → $sort by createdAt
// MongoDB uses the leftmost prefix, so { vendorId } and { vendorId, status }
// queries are also covered without a separate index.
OrderSchema.index({ vendorId: 1, status: 1, createdAt: -1 });

export default mongoose.models.Order ||
  mongoose.model<IOrder>("Order", OrderSchema);