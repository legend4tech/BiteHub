import mongoose, { Schema, Document } from "mongoose";

export interface IVendor extends Document {
  name: string;
  slug: string;
  description: string;
  category: string;
  tags: string[];
  whatsappNumber: string;
  school: string;
  campus: string;
  isActive: boolean;

  // Virtuals
  initials: string;
  tagline: string;
  location: string;
}

const VendorSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    category: { type: String },
    tags: { type: [String], default: [] },
    whatsappNumber: { type: String },
    school: { type: String },
    campus: { type: String },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = String(ret._id);
        delete ret._id;
        delete ret.__v;
      },
    },
    toObject: { virtuals: true },
  }
);

// Virtuals for UI (Fabricated data)
VendorSchema.virtual("initials").get(function (this: IVendor) {
  const name = this.name;
  return name
    ? name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "";
});
VendorSchema.virtual("tagline").get(function (this: IVendor) {
  return this.description || "The best food on campus";
});
VendorSchema.virtual("location").get(function (this: IVendor) {
  return this.campus || "Main Campus";
});

export default mongoose.models.Vendor ||
  mongoose.model<IVendor>("Vendor", VendorSchema);
