import mongoose, { Schema, Document } from "mongoose"

export interface IVendorFeedback extends Document {
  vendorId: mongoose.Types.ObjectId | string
  customerId: mongoose.Types.ObjectId | string
  rating: number
  orderId: string
  isAnonymous?: boolean
}

const VendorFeedbackSchema: Schema = new Schema(
  {
    vendorId: { type: Schema.Types.ObjectId, ref: "Vendor", required: true },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    orderId: { type: String, required: true },
    isAnonymous: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = String(ret._id)
        delete ret._id
        delete ret.__v
      },
    },
    toObject: { virtuals: true },
  }
)

// Enforce one review per customer per vendor
VendorFeedbackSchema.index({ vendorId: 1, customerId: 1 }, { unique: true })

export default mongoose.models.VendorFeedback ||
  mongoose.model<IVendorFeedback>("VendorFeedback", VendorFeedbackSchema)
