import mongoose, { Schema, Document } from "mongoose";

export interface IVendorFeedback extends Document {
  vendorId: string;
  rating: number;
  comments?: string;
  orderId: string;
  isAnonymous?: boolean;
}

const VendorFeedbackSchema: Schema = new Schema(
  {
    vendorId: { type: Schema.Types.ObjectId, ref: "Vendor", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comments: { type: String },
    orderId: { type: String, required: true },
    isAnonymous: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = String(ret._id);
        delete ret._id;
        delete ret.__v;
      },
    },
    toObject: { virtuals: true },
  }
);

export default mongoose.models.VendorFeedback ||
  mongoose.model<IVendorFeedback>("VendorFeedback", VendorFeedbackSchema);
