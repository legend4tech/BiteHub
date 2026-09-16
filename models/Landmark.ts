import mongoose, { Schema, Document } from "mongoose"

export interface ILandmark extends Document {
  school: string
  campus: string
  name: string
  defaultDeliveryFee: number
  isActive: boolean
}

const LandmarkSchema = new Schema<ILandmark>(
  {
    school: { type: String, required: true, index: true },
    campus: { type: String, required: true, index: true },
    name: { type: String, required: true },
    defaultDeliveryFee: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = String(ret._id)
        delete ret._id
        delete ret.__v
      },
    },
    toObject: { virtuals: true },
  }
)

LandmarkSchema.index({ school: 1, campus: 1, isActive: 1, name: 1 })

export default mongoose.models.Landmark ||
  mongoose.model<ILandmark>("Landmark", LandmarkSchema)
