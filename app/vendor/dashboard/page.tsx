"use client";

import { useEffect, useState } from "react";
import { useVendorAuth } from "@/hooks/useVendorAuth";
import { useOrders } from "@/hooks/useOrders";
import { DashboardStats } from "@/components/vendor/DashboardStats";
import { OrderTable } from "@/components/vendor/OrderTable";
import type { Order, OrderStatus } from "@/lib/types";

export default function VendorDashboardPage() {
  const { session } = useVendorAuth();
  const { getOrdersByVendor, updateStatus } = useOrders();
  const [orders, setOrders] = useState<Order[]>([]);

  const load = () => {
    if (session) setOrders(getOrdersByVendor(session.vendorId));
  };

  useEffect(() => { load(); }, [session]);

  const today = new Date().toDateString();
  const todayOrders = orders.filter((o) => new Date(o.createdAt).toDateString() === today);
  const pending   = todayOrders.filter((o) => o.status === "pending").length;
  const preparing = todayOrders.filter((o) => o.status === "preparing" || o.status === "confirmed").length;
  const completed = todayOrders.filter((o) => o.status === "completed").length;

  const handleStatusChange = (orderId: string, status: OrderStatus) => {
    updateStatus(orderId, status);
    load();
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-muted-foreground">Welcome back,</p>
        <h1 className="font-heading text-2xl font-bold">{session?.vendorName}</h1>
      </div>

      <DashboardStats
        total={todayOrders.length}
        pending={pending}
        preparing={preparing}
        completed={completed}
      />

      <div className="rounded-2xl bg-card border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-bold text-lg">Recent orders</h2>
          <span className="text-xs text-muted-foreground">{orders.length} total</span>
        </div>
        <OrderTable orders={orders.slice(0, 10)} onStatusChange={handleStatusChange} />
      </div>
    </div>
  );
}
