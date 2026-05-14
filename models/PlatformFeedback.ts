import mongoose, { Schema, Document } from "mongoose";

export interface IPlatformFeedback extends Document {
  rating: number;
  comments?: string;
  orderId?: string;
  vendorId?: string; // For vendor giving feedback
}

const PlatformFeedbackSchema: Schema = new Schema(
  {
    rating: { type: Number, required: true, min: 1, max: 5 },
    comments: { type: String },
    orderId: { type: String },
    vendorId: { type: Schema.Types.ObjectId, ref: "Vendor" },
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

export default mongoose.models.PlatformFeedback ||
  mongoose.model<IPlatformFeedback>("PlatformFeedback", PlatformFeedbackSchema);
