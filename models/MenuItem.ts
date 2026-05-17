import mongoose, { Schema, Document, Types } from "mongoose";

export interface IMenuItem extends Document {
  vendorId: Types.ObjectId;
  name: string;
  description?: string;
  price: number;
  category: string;
  image?: {
    url: string;
    publicId: string;
  };
  isAvailable: boolean;
  availableFrom?: string;
  availableTo?: string;
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
    image: {
      url: { type: String },
      publicId: { type: String },
    },
    isAvailable: { type: Boolean, default: true },
    availableFrom: { type: String },
    availableTo: { type: String },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = String(ret._id);
        // Serialize vendorId as string for the frontend
        if (ret.vendorId) {
          ret.vendorId = String(ret.vendorId);
        }
        delete ret._id;
        delete ret.__v;
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