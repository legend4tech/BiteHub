import mongoose, { Schema, Document } from "mongoose";

export interface IMenuItem extends Document {
  vendorId: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  image?: string;
  isAvailable: boolean;
}

const MenuItemSchema: Schema = new Schema(
  {
    vendorId: { type: String, required: true },
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
        delete (ret as any)._id;
        delete (ret as any).__v;
      },
    },
    toObject: { virtuals: true },
  }
);

export default mongoose.models.MenuItem ||
  mongoose.model<IMenuItem>("MenuItem", MenuItemSchema);
