import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import VendorModel from "@/models/Vendor";
import { serializeVendor } from "@/lib/serializers";
import { VendorSettingsForm } from "@/components/vendor/VendorSettingsForm";
import { redirect, notFound } from "next/navigation";

export default async function VendorSettingsPage() {
  const session = await auth();
  if (!session || session.user?.role !== "vendor" || !session.user?.vendorId) {
    redirect("/vendor/login");
  }

  await dbConnect();
  const vendor = await VendorModel.findById(session.user.vendorId).lean();
  
  if (!vendor) {
    notFound();
  }

  const serializedVendor = serializeVendor(vendor);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Update your store details</p>
      </div>
      <div className="rounded-3xl bg-card border border-border p-6 max-w-2xl">
        <VendorSettingsForm initial={serializedVendor as any} />
      </div>
    </div>
  );
}
