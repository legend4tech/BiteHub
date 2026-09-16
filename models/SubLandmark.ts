import mongoose, { Schema, Document, Types } from "mongoose"

export interface ISubLandmark extends Document {
  landmarkId: Types.ObjectId
  name: string
  defaultDeliveryFee?: number
  isActive: boolean
}

const SubLandmarkSchema = new Schema<ISubLandmark>(
  {
    landmarkId: {
      type: Schema.Types.ObjectId,
      ref: "Landmark",
      required: true,
      index: true,
    },
    name: { type: String, required: true },
    defaultDeliveryFee: { type: Number },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = String(ret._id)
        ret.landmarkId = String(ret.landmarkId)
        delete ret._id
        delete ret.__v
      },
    },
    toObject: { virtuals: true },
  }
)

SubLandmarkSchema.index({ landmarkId: 1, isActive: 1, name: 1 })

export default mongoose.models.SubLandmark ||
  mongoose.model<ISubLandmark>("SubLandmark", SubLandmarkSchema)
