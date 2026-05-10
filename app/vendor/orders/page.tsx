"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { OrderTable } from "@/components/vendor/OrderTable";
import type { Order, OrderStatus } from "@/lib/types";
import { ORDER_STATUS_CONFIG } from "@/lib/constants";
import { PageSkeleton } from "@/components/shared/PageSkeleton";
import apiClient from "@/lib/axios";
import { toast } from "sonner";

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
  const { data: session } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await apiClient.get("/vendor/orders");
      setOrders(res.data);
    } catch (error) {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user) load();
  }, [session, load]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await apiClient.patch(`/vendor/orders/${orderId}`, { status: newStatus });
      load();
    } catch (error) {
      toast.error("Failed to update order status");
    }
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
        {loading ? (
          <PageSkeleton variant="orders-table" count={5} />
        ) : (
          <OrderTable orders={filtered} onStatusChange={handleStatusChange} />
        )}
      </div>
    </div>
  );
}
