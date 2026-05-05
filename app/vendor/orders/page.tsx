"use client";

import { useEffect, useState } from "react";
import { useVendorAuth } from "@/hooks/useVendorAuth";
import { useOrders } from "@/hooks/useOrders";
import { OrderTable } from "@/components/vendor/OrderTable";
import { StatusBadge } from "@/components/vendor/StatusBadge";
import type { Order, OrderStatus } from "@/lib/types";
import { ORDER_STATUS_CONFIG } from "@/lib/constants";

const FILTER_OPTIONS: { value: OrderStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "preparing", label: "Preparing" },
  { value: "ready", label: "Ready" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function VendorOrdersPage() {
  const { session } = useVendorAuth();
  const { getOrdersByVendor, updateStatus } = useOrders();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");

  const load = () => {
    if (session) setOrders(getOrdersByVendor(session.vendorId));
  };

  useEffect(() => { load(); }, [session]);

  const handleStatusChange = (orderId: string, status: OrderStatus) => {
    updateStatus(orderId, status);
    load();
  };

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Orders</h1>
        <p className="text-sm text-muted-foreground mt-1">{orders.length} total orders</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTER_OPTIONS.map((opt) => {
          const count = opt.value === "all" ? orders.length : orders.filter((o) => o.status === opt.value).length;
          return (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all border ${
                filter === opt.value
                  ? "bg-primary text-white border-primary"
                  : "bg-background border-border text-muted-foreground hover:border-primary"
              }`}
            >
              {opt.label}
              <span className="ml-1.5 text-xs opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl bg-card border border-border p-6">
        <OrderTable orders={filtered} onStatusChange={handleStatusChange} />
      </div>
    </div>
  );
}
