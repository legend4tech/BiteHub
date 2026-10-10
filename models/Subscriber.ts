import mongoose, { Schema, Document, Model } from "mongoose"

export interface ISubscriber extends Document {
  email: string
  isActive: boolean
  subscribedAt: Date
}

const SubscriberSchema: Schema<ISubscriber> = new Schema(
  {
    email: { type: String, required: true, unique: true },
    isActive: { type: Boolean, default: true },
    subscribedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

const Subscriber: Model<ISubscriber> =
  mongoose.models.Subscriber ||
  mongoose.model<ISubscriber>("Subscriber", SubscriberSchema)

export default Subscriber
