import mongoose, { Schema, Document, Types } from "mongoose"

export interface ICampaignProgress extends Document {
  id: string
  customerId: Types.ObjectId
  campaignId: Types.ObjectId

  // Progress tracking
  currentCount: number // e.g., 3 out of 5 referrals
  timesCompleted: number // How many times they have won this campaign
  isFullyCompleted: boolean // True if they reached maxCompletionsPerUser

  // Array of tracked IDs (e.g., referred customer IDs, or order IDs) to prevent double counting
  trackedEntityIds: string[]

  createdAt: Date
  updatedAt: Date
}

const CampaignProgressSchema = new Schema<ICampaignProgress>(
  {
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

    currentCount: { type: Number, default: 0, min: 0 },
    timesCompleted: { type: Number, default: 0, min: 0 },
    isFullyCompleted: { type: Boolean, default: false },

    trackedEntityIds: [{ type: String }], // Allows tracking unique events
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

// A customer can only have one progress record per campaign
CampaignProgressSchema.index({ customerId: 1, campaignId: 1 }, { unique: true })

export default mongoose.models.CampaignProgress ||
  mongoose.model<ICampaignProgress>("CampaignProgress", CampaignProgressSchema)
