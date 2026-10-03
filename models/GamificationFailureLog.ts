import mongoose, { Schema, Document } from "mongoose"

export interface IGamificationFailureLog extends Document {
  id: string
  orderId?: string
  customerId?: mongoose.Types.ObjectId
  campaignId?: mongoose.Types.ObjectId
  errorMessage: string
  errorStack?: string
  context: string
  resolved: boolean
  createdAt: Date
  updatedAt: Date
}

const GamificationFailureLogSchema = new Schema<IGamificationFailureLog>(
  {
    orderId: { type: String },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer" },
    campaignId: { type: Schema.Types.ObjectId, ref: "RewardCampaign" },
    errorMessage: { type: String, required: true },
    errorStack: { type: String },
    context: { type: String, required: true },
    resolved: { type: Boolean, default: false },
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

GamificationFailureLogSchema.index({ resolved: 1, createdAt: -1 })

export default mongoose.models.GamificationFailureLog ||
  mongoose.model<IGamificationFailureLog>(
    "GamificationFailureLog",
    GamificationFailureLogSchema
  )
