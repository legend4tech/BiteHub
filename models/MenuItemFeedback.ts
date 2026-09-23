import mongoose, { Schema, Document } from "mongoose"

export interface IMenuItemFeedback extends Document {
  menuItemId: mongoose.Types.ObjectId | string
  orderId: string
  customerId: mongoose.Types.ObjectId | string
  vendorId: mongoose.Types.ObjectId | string
  rating: number
  title: string
  comments?: string
  isAnonymous?: boolean
  createdAt: Date
  updatedAt: Date
}

const MenuItemFeedbackSchema: Schema = new Schema(
  {
    menuItemId: {
      type: Schema.Types.ObjectId,
      ref: "MenuItem",
      required: true,
    },
    orderId: { type: String, required: true },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    vendorId: { type: Schema.Types.ObjectId, ref: "Vendor", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, required: true },
    comments: { type: String },
    isAnonymous: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = String(ret._id)
        if (ret.menuItemId) ret.menuItemId = String(ret.menuItemId)
        if (ret.customerId) ret.customerId = String(ret.customerId)
        if (ret.vendorId) ret.vendorId = String(ret.vendorId)
        delete ret._id
        delete ret.__v
      },
    },
    toObject: { virtuals: true },
  }
)

// Enforce one review per customer per menu item
MenuItemFeedbackSchema.index({ menuItemId: 1, customerId: 1 }, { unique: true })

export default mongoose.models.MenuItemFeedback ||
  mongoose.model<IMenuItemFeedback>("MenuItemFeedback", MenuItemFeedbackSchema)
