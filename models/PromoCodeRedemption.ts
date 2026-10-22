import mongoose, { Schema, Document, Types } from "mongoose"

export interface IPromoCodeRedemption extends Document {
  id: string
  promoCodeId: Types.ObjectId
  code: string
  customerId: Types.ObjectId
  orderId: string
  discountAmountInKobo: number
  redeemedAt: Date
  createdAt: Date
  updatedAt: Date
}

const PromoCodeRedemptionSchema = new Schema<IPromoCodeRedemption>(
  {
    promoCodeId: {
      type: Schema.Types.ObjectId,
      ref: "PromoCode",
      required: true,
    },
    code: { type: String, required: true, uppercase: true, trim: true },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    orderId: { type: String, required: true },
    discountAmountInKobo: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "{VALUE} is not an integer value",
      },
    },
    redeemedAt: { type: Date, default: Date.now },
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

PromoCodeRedemptionSchema.index({ promoCodeId: 1, customerId: 1 })
PromoCodeRedemptionSchema.index({ customerId: 1 })
PromoCodeRedemptionSchema.index({ orderId: 1 }, { unique: true })

export default mongoose.models.PromoCodeRedemption ||
  mongoose.model<IPromoCodeRedemption>(
    "PromoCodeRedemption",
    PromoCodeRedemptionSchema
  )
