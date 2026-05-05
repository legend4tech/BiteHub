import mongoose, { Schema, Document } from "mongoose";

export interface IVendor extends Document {
  name: string;
  slug: string;
  description: string;
  category: string;
  tags: string[];
  phone: string;
  whatsappNumber: string;
  school: string;
  campus: string;
  isActive: boolean;

  initials: string;
  tagline: string;
  location: string;
  password?: string;
}

const VendorSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true },
    description: { type: String },
    category: { type: String },
    tags: { type: [String], default: [] },
    phone: { type: String },
    whatsappNumber: { type: String },
    school: { type: String },
    campus: { type: String },
    isActive: { type: Boolean, default: true },
    password: { type: String },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        (ret as any).id = (ret as any)._id.toString();
        delete (ret as any)._id;
        delete (ret as any).__v;
        delete (ret as any).password;
      },
    },
    toObject: { virtuals: true },
  }
);

// Virtuals for UI (Fabricated data)
VendorSchema.virtual("initials").get(function () {
  const name = this.name as string;
  return name
    ? name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "";
});
VendorSchema.virtual("tagline").get(function () {
  return this.description || "The best food on campus";
});
VendorSchema.virtual("location").get(function () {
  return this.campus || "Main Campus";
});

export default mongoose.models.Vendor ||
  mongoose.model<IVendor>("Vendor", VendorSchema);
