import mongoose, { Schema, Document } from "mongoose"

export interface IPlatformWithdrawal extends Document {
  amount: number
  reference: string
  note?: string
  withdrawnBy: string // admin email
  createdAt: Date
  updatedAt: Date
}

const PlatformWithdrawalSchema = new Schema<IPlatformWithdrawal>(
  {
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    reference: {
      type: String,
      required: true,
      trim: true,
    },
    note: {
      type: String,
      trim: true,
    },
    withdrawnBy: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

PlatformWithdrawalSchema.index({ createdAt: -1 })

export default mongoose.models.PlatformWithdrawal ||
  mongoose.model<IPlatformWithdrawal>(
    "PlatformWithdrawal",
    PlatformWithdrawalSchema
  )
