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
  status: "pending" | "confirmed" | "preparing" | "ready" | "cancelled";
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
      enum: ["pending", "confirmed", "preparing", "ready", "cancelled"],
      default: "pending",
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        (ret as any).id = (ret as any)._id.toString();
        (ret as any).vendorId = (ret as any).vendorId.toString();
        delete (ret as any)._id;
        delete (ret as any).__v;
      },
    },
  }
);

// Index for fast lookups by orderId (used by order page)
// Removed manual index because unique: true in schema already creates it
// Index for vendor dashboard — fetching all orders for a vendor
OrderSchema.index({ vendorId: 1, createdAt: -1 });

export default mongoose.models.Order ||
  mongoose.model<IOrder>("Order", OrderSchema);