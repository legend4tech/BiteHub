import mongoose, { Schema, Document } from "mongoose"

export interface IWallet extends Document {
  customerId: mongoose.Types.ObjectId
  balanceInKobo: number
  depositBalanceInKobo: number
  promoBalanceInKobo: number
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
    balanceInKobo: {
      type: Number,
      default: 0,
      min: [0, "Balance cannot be negative"],
      validate: {
        validator: Number.isInteger,
        message: "{VALUE} is not an integer value",
      },
    },
    depositBalanceInKobo: {
      type: Number,
      default: 0,
      min: [0, "Deposit balance cannot be negative"],
      validate: {
        validator: Number.isInteger,
        message: "{VALUE} is not an integer value",
      },
    },
    promoBalanceInKobo: {
      type: Number,
      default: 0,
      min: [0, "Promo balance cannot be negative"],
      validate: {
        validator: Number.isInteger,
        message: "{VALUE} is not an integer value",
      },
    },
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
