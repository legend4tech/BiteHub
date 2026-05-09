import mongoose, { Schema, Document, Types } from "mongoose";

export interface IMenuItem extends Document {
  vendorId: Types.ObjectId;
  name: string;
  description?: string;
  price: number;
  category: string;
  image?: string;
  isAvailable: boolean;
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
    price: { type: Number, required: true },
    category: { type: String, required: true },
    image: { type: String },
    isAvailable: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        (ret as any).id = (ret as any)._id.toString();
        // Serialize vendorId as string for the frontend
        if ((ret as any).vendorId) {
          (ret as any).vendorId = (ret as any).vendorId.toString();
        }
        delete (ret as any)._id;
        delete (ret as any).__v;
      },
    },
    toObject: { virtuals: true },
  }
);

// Index for fast vendor lookups
MenuItemSchema.index({ vendorId: 1 });
MenuItemSchema.index({ vendorId: 1, isAvailable: 1 });
MenuItemSchema.index({ category: 1, isAvailable: 1 });

export default mongoose.models.MenuItem ||
  mongoose.model<IMenuItem>("MenuItem", MenuItemSchema);