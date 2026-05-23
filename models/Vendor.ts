import mongoose, { Schema, Document } from "mongoose"

export interface IVendor extends Document {
  name: string
  slug: string
  description: string
  category: string
  tags: string[]
  whatsappNumber: string
  school: string
  campus: string
  isActive: boolean
  image?: {
    url: string
    publicId: string
  }

  // Virtuals
  initials: string
  tagline: string
  location: string
}

const VendorSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    tags: { type: [String], default: [] },
    whatsappNumber: { type: String, required: true },
    school: { type: String, required: true },
    campus: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    image: {
      url: { type: String },
      publicId: { type: String },
    },
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

// Virtuals for UI (Fabricated data)
VendorSchema.virtual("initials").get(function (this: IVendor) {
  const name = this.name
  return name
    ? name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : ""
})
VendorSchema.virtual("tagline").get(function (this: IVendor) {
  return this.description || "The best food on campus"
})
VendorSchema.virtual("location").get(function (this: IVendor) {
  return this.campus || "Main Campus"
})

// Indexes for high-performance querying
VendorSchema.index({ school: 1, campus: 1, isActive: 1 })
VendorSchema.index({ name: "text", category: "text" })

export default mongoose.models.Vendor ||
  mongoose.model<IVendor>("Vendor", VendorSchema)
