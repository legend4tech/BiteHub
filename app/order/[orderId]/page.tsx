"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { OrderStatusTracker } from "@/components/cart/OrderStatusTracker";
import { WhatsAppButton } from "@/components/cart/WhatsAppButton";
import { StatusBadge } from "@/components/vendor/StatusBadge";
import { useOrders } from "@/hooks/useOrders";
import type { Order } from "@/lib/types";
import { RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OrderPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { getOrder } = useOrders();
  const [order, setOrder] = useState<Order | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const load = useCallback(() => {
    setOrder(getOrder(orderId));
    setLastRefreshed(new Date());
  }, [orderId, getOrder]);

  useEffect(() => { load(); }, [load]);

  if (!order) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-40 gap-4">
          <p className="text-4xl">🔍</p>
          <h1 className="font-heading text-2xl font-bold">Order not found</h1>
          <p className="text-muted-foreground text-sm">Order ID: <span className="font-mono">{orderId}</span></p>
          <Button asChild variant="hero"><Link href="/"><Home className="size-4" />Go home</Link></Button>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground pb-20">
      <Navbar />

      <div className="mx-auto max-w-2xl px-6 py-12 space-y-6">
        {/* Order ID card */}
        <div className="rounded-3xl bg-card border border-border p-8">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider">Order placed!</p>
          <h1 className="font-heading text-3xl font-bold mt-1">{order.orderId}</h1>
          <p className="text-muted-foreground text-sm mt-2">
            from <span className="font-semibold text-foreground">{order.vendorName}</span>
            {" · "}{new Date(order.createdAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}
          </p>
          <div className="mt-4">
            <StatusBadge status={order.status} />
          </div>
        </div>

        {/* Status tracker */}
        <div className="rounded-3xl bg-card border border-border p-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-heading font-bold text-lg">Order status</h2>
            <button onClick={load} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <RefreshCw className="size-3.5" />
              Refresh · {lastRefreshed.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
            </button>
          </div>
          <OrderStatusTracker status={order.status} />
        </div>

        {/* Items */}
        <div className="rounded-3xl bg-card border border-border p-8">
          <h2 className="font-heading font-bold text-lg mb-4">Your items</h2>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.menuItemId} className="flex justify-between text-sm">
                <span>{item.name} <span className="text-muted-foreground">×{item.quantity}</span></span>
                <span className="font-semibold">₦{(item.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between font-bold mt-4 pt-4 border-t border-border">
            <span>Total</span>
            <span className="text-primary">₦{order.total.toLocaleString()}</span>
          </div>
          {order.notes && (
            <div className="mt-4 rounded-xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Note: </span>{order.notes}
            </div>
          )}
        </div>

        {/* WhatsApp */}
        <div className="rounded-3xl bg-card border border-border p-8 space-y-3">
          <h2 className="font-heading font-bold text-lg">Contact vendor</h2>
          <p className="text-sm text-muted-foreground">
            Send your order details to the vendor via WhatsApp to confirm and get updates.
          </p>
          <WhatsAppButton
            vendorPhone={order.vendorPhone}
            order={{
              orderId: order.orderId,
              customerName: order.customerName,
              items: order.items,
              total: order.total,
              notes: order.notes,
            }}
          />
        </div>
      </div>
    </main>
  );
}
