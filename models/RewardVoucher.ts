import mongoose, { Schema, Document, Types } from "mongoose"

export interface IRewardVoucher extends Document {
  id: string
  code: string // Cryptographically secure 6-10 char string
  customerId: Types.ObjectId
  campaignId: Types.ObjectId

  // What does the voucher grant?
  vendorId: Types.ObjectId
  menuItemId: string

  isUsed: boolean
  usedAt?: Date
  usedOrderId?: string // The order where this was applied

  expiresAt: Date
  createdAt: Date
  updatedAt: Date
}

const RewardVoucherSchema = new Schema<IRewardVoucher>(
  {
    code: { type: String, required: true, unique: true },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: "RewardCampaign",
      required: true,
    },

    vendorId: { type: Schema.Types.ObjectId, ref: "Vendor", required: true },
    menuItemId: { type: String, required: true },

    isUsed: { type: Boolean, default: false },
    usedAt: { type: Date },
    usedOrderId: { type: String }, // Stores BiteHub's custom orderId string

    expiresAt: { type: Date, required: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = String(ret._id)
        delete (ret as Record<string, unknown>)._id
        delete (ret as Record<string, unknown>).__v
      },
    },
  }
)

RewardVoucherSchema.index({ customerId: 1, isUsed: 1 }) // Fast lookup for a customer's active vouchers
RewardVoucherSchema.index({ code: 1 }, { unique: true })

export default mongoose.models.RewardVoucher ||
  mongoose.model<IRewardVoucher>("RewardVoucher", RewardVoucherSchema)
