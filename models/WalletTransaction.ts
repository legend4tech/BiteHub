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
    reference: { type: String, required: true, unique: true },
    description: { type: String, required: true },
  },
  {
    timestamps: true,
  }
)

export default mongoose.models.WalletTransaction ||
  mongoose.model<IWalletTransaction>(
    "WalletTransaction",
    WalletTransactionSchema
  )
