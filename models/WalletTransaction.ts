import mongoose, { Schema, Document } from "mongoose"

export interface IWalletTransaction extends Document {
  customerId: mongoose.Types.ObjectId
  type:
    | "deposit"
    | "order_payment"
    | "reward"
    | "refund"
    | "crypto_deposit"
    | "fiat_deposit"
  amount: number
  balanceAfter: number
  direction: "credit" | "debit"
  reference: string
  description: string
  expiresAt?: Date
  isExpired?: boolean
  remainingAmount?: number
  warningEmailSentAt?: Date
  createdAt: Date
  updatedAt: Date
}

const WalletTransactionSchema = new Schema<IWalletTransaction>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "deposit",
        "order_payment",
        "reward",
        "refund",
        "crypto_deposit",
        "fiat_deposit",
      ],
      required: true,
    },
    amount: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    direction: { type: String, enum: ["credit", "debit"], required: true },
    reference: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    expiresAt: { type: Date },
    isExpired: { type: Boolean, default: false },
    remainingAmount: { type: Number },
    warningEmailSentAt: { type: Date },
  },
  {
    timestamps: true,
  }
)

WalletTransactionSchema.index({ customerId: 1, createdAt: -1 })
WalletTransactionSchema.index({ type: 1, expiresAt: 1, isExpired: 1 })
WalletTransactionSchema.index({ type: 1, direction: 1 }) // Fast lookup for analytics (Total BHC Issued)

export default mongoose.models.WalletTransaction ||
  mongoose.model<IWalletTransaction>(
    "WalletTransaction",
    WalletTransactionSchema
  )
