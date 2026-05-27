import mongoose, { Schema, Document } from "mongoose"

export interface IGlobalSettings extends Document {
  platformFeePercentage: number
  maintenanceMode: boolean
  updatedBy: string // The email or name of the admin who last updated it
}

const GlobalSettingsSchema = new Schema<IGlobalSettings>(
  {
    platformFeePercentage: {
      type: Number,
      default: 5,
      min: 0,
      max: 100,
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    updatedBy: {
      type: String,
      default: "system",
    },
  },
  {
    timestamps: true,
  }
)

export default mongoose.models.GlobalSettings ||
  mongoose.model<IGlobalSettings>("GlobalSettings", GlobalSettingsSchema)
