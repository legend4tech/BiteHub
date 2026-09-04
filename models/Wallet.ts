import mongoose, { Schema, Document } from "mongoose"

export interface IWallet extends Document {
  customerId: mongoose.Types.ObjectId
  balance: number
  monnifyReservedAccountRef?: string
  accountName?: string
  accountNumber?: string
  bankName?: string
  createdAt: Date
  updatedAt: Date
}

const WalletSchema = new Schema<IWallet>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      unique: true,
    },
    balance: { type: Number, default: 0 },
    monnifyReservedAccountRef: { type: String },
    accountName: { type: String },
    accountNumber: { type: String },
    bankName: { type: String },
  },
  {
    timestamps: true,
  }
)

export default mongoose.models.Wallet ||
  mongoose.model<IWallet>("Wallet", WalletSchema)
