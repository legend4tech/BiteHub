import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Order from "@/models/Order";
import { serializeOrder } from "@/lib/serializers";
import { VendorOrders } from "@/components/vendor/VendorOrders";
import { Types } from "mongoose";
import { redirect } from "next/navigation";
import type { Order as OrderType } from "@/lib/types";

export default async function VendorOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await auth();
  if (!session || session.user?.role !== "vendor" || !session.user?.vendorId) {
    redirect("/vendor/login");
  }

  await dbConnect();
  const vendorId = new Types.ObjectId(session.user.vendorId);
  
  const resolvedSearchParams = await searchParams;
  const activeStatus = resolvedSearchParams.status || "all";

  // Fetch all orders for counts
  const allOrdersDocs = await Order.find({ vendorId }).sort({ createdAt: -1 }).lean();
  const allOrders = allOrdersDocs.map(serializeOrder).filter(Boolean) as OrderType[];

  // Filter orders by status
  const ordersDocs = activeStatus === "all"
    ? allOrdersDocs
    : await Order.find({ vendorId, status: activeStatus }).sort({ createdAt: -1 }).lean();
  const orders = ordersDocs.map(serializeOrder).filter(Boolean) as OrderType[];

  return (
    <VendorOrders 
      orders={orders} 
      allOrders={allOrders} 
      activeStatus={activeStatus} 
    />
  );
}
