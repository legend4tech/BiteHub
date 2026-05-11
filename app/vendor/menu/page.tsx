import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import MenuItemModel from "@/models/MenuItem";
import { serializeMenuItem } from "@/lib/serializers";
import { VendorMenuManagement } from "@/components/vendor/VendorMenuManagement";
import { Types } from "mongoose";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import type { MenuItem } from "@/lib/types";

export default async function VendorMenuPage() {
  const session = await auth();
  if (!session || session.user?.role !== "vendor" || !session.user?.vendorId) {
    redirect("/vendor/login");
  }

  await dbConnect();
  const vendorId = new Types.ObjectId(session.user.vendorId);

  // Fetch initial 10 items
  const itemsDocs = await MenuItemModel.find({ vendorId })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();
    
  const items = itemsDocs.map(serializeMenuItem).filter(Boolean) as MenuItem[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Menu Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Add, edit, or remove items from your store</p>
        </div>
        <Button variant="hero" asChild className="gap-2">
          <Link href="/vendor/menu/new">
            <Plus className="size-4" /> Add Item
          </Link>
        </Button>
      </div>

      <VendorMenuManagement initialItems={items} />
    </div>
  );
}
