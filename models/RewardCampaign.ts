import mongoose, { Schema, Document, Types } from "mongoose"

export interface IRewardCampaign extends Document {
  id: string
  title: string
  description?: string

  // What does the user have to do?
  actionType: "REFERRAL_SIGNUP" | "REFERRAL_FIRST_ORDER" | "ORDER_COMPLETED"
  targetCount: number // e.g., refer 5 people
  minOrderValue?: number // Optional: Only orders above this amount count

  // What is the reward?
  rewardType: "BITEHUB_COINS" | "FREE_MEAL"
  rewardValue?: number // e.g., 500 coins
  rewardExpiryDays: number // How many days until the reward expires?

  // If FREE_MEAL, what is it?
  vendorId?: Types.ObjectId
  menuItemId?: string // Not an ObjectId since we often just store string IDs from vendor menus

  // Audience Targeting
  targetSchool?: string // If null/undefined, applies to all schools
  targetCampus?: string // If null/undefined, applies to all campuses

  // Budgeting & Fintech Protections
  maxBeneficiaries: number // How many users can win this? (e.g., 50)
  currentBeneficiaries: number // How many have won so far?
  budgetAllocated: number // Total NGN BiteHub is willing to spend
  budgetSpent: number // Total NGN spent so far

  // Campaign Constraints
  isActive: boolean
  startDate: Date
  endDate?: Date

  // Can a user complete this multiple times? (e.g., 1 for Grand Prize, 0 for infinite)
  maxCompletionsPerUser: number

  createdAt: Date
  updatedAt: Date
}

const RewardCampaignSchema = new Schema<IRewardCampaign>(
  {
    title: { type: String, required: true },
    description: { type: String },

    actionType: {
      type: String,
      enum: ["REFERRAL_SIGNUP", "REFERRAL_FIRST_ORDER", "ORDER_COMPLETED"],
      required: true,
    },
    targetCount: { type: Number, required: true, min: 1 },
    minOrderValue: { type: Number },

    rewardType: {
      type: String,
      enum: ["BITEHUB_COINS", "FREE_MEAL"],
      required: true,
    },
    rewardValue: { type: Number }, // Only needed for COINS
    rewardExpiryDays: { type: Number, required: true, default: 90 },

    vendorId: { type: Schema.Types.ObjectId, ref: "Vendor" },
    menuItemId: { type: String }, // For FREE_MEAL

    targetSchool: { type: String },
    targetCampus: { type: String },

    maxBeneficiaries: { type: Number, required: true },
    currentBeneficiaries: { type: Number, default: 0 },
    budgetAllocated: { type: Number, required: true, min: 0 },
    budgetSpent: { type: Number, default: 0, min: 0 },

    isActive: { type: Boolean, default: true },
    startDate: { type: Date, default: Date.now, required: true },
    endDate: { type: Date },

    maxCompletionsPerUser: { type: Number, required: true, default: 1 }, // 0 means unlimited
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

RewardCampaignSchema.index({ isActive: 1, actionType: 1 })
RewardCampaignSchema.index({ startDate: 1, endDate: 1 })

export default mongoose.models.RewardCampaign ||
  mongoose.model<IRewardCampaign>("RewardCampaign", RewardCampaignSchema)
