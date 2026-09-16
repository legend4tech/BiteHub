import mongoose, { Schema, Document } from "mongoose"

export interface IWalletTransaction extends Document {
  customerId: mongoose.Types.ObjectId
  type:
    | "deposit"
    | "order_payment"
    | "reward"
    | "crypto_deposit"
    | "fiat_deposit"
  amount: number
  balanceAfter: number
  direction: "credit" | "debit"
  reference: string
  description: string
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
  },
  {
    timestamps: true,
  }
)

WalletTransactionSchema.index({ customerId: 1, createdAt: -1 })

export default mongoose.models.WalletTransaction ||
  mongoose.model<IWalletTransaction>(
    "WalletTransaction",
    WalletTransactionSchema
  )
