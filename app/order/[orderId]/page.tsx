"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { OrderStatusTracker } from "@/components/cart/OrderStatusTracker";
import { WhatsAppButton } from "@/components/cart/WhatsAppButton";
import { StatusBadge } from "@/components/vendor/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { FetchError } from "@/components/shared/FetchError";
import { PageSkeleton } from "@/components/shared/PageSkeleton";
import { RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import apiClient from "@/lib/axios";
import type { OrderStatus } from "@/lib/types";

interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  orderId: string;
  vendorId: string;
  vendorName: string;
  vendorWhatsappNumber: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  notes?: string;
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
}

export default function OrderPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());



  const load = useCallback(async () => {
    try {
      setError(null);
      const response = await apiClient.get(`/orders?orderId=${orderId}`);
      setOrder(response.data);
      setLastRefreshed(new Date());
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setError("not_found");
      } else {
        setError("server_error");
      }
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRefresh = () => {
    setLoading(true);
    load();
  };

  // Loading state
  if (loading) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="container mx-auto px-6 py-12">
          <PageSkeleton variant="order-detail" />
        </div>
        <Footer />
      </main>
    );
  }

  // Not found
  if (error === "not_found" || !order) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <Navbar />
        <EmptyState
        
          title="Order not found"
          description={`We couldn't find an order with ID "${orderId}". Please check the ID or try again later.`}
          action={{
            label: "Go home",
            href: "/",
            icon: <Home className="size-4" />,
          }}
          className="py-40"
        />
        <Footer />
      </main>
    );
  }

  // Server error
  if (error === "server_error") {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <Navbar />
        <FetchError
          title="Failed to load order"
          message="We encountered an issue while retrieving your order details."
          onRetry={handleRefresh}
          onBack="/"
          className="py-20"
        />
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
          <p className="text-sm font-semibold text-primary uppercase tracking-wider">
            Order placed!
          </p>
          <h1 className="font-heading text-3xl font-bold mt-1">{order.orderId}</h1>
          <p className="text-muted-foreground text-sm mt-2">
            from{" "}
            <span className="font-semibold text-foreground">{order.vendorName}</span>
            {" · "}
            {new Date(order.createdAt).toLocaleDateString("en-NG", {
              month: "short",
              day: "numeric",
            })}{" "}
            {new Date(order.createdAt).toLocaleTimeString("en-NG", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          <div className="mt-4">
            <StatusBadge status={order.status} />
          </div>
        </div>

        {/* Status tracker */}
        <div className="rounded-3xl bg-card border border-border p-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-heading font-bold text-lg">Order status</h2>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <RefreshCw className="size-3.5" />
              Refresh ·{" "}
              {lastRefreshed.toLocaleTimeString("en-NG", {
                hour: "2-digit",
                minute: "2-digit",
              })}
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
                <span>
                  {item.name}{" "}
                  <span className="text-muted-foreground">×{item.quantity}</span>
                </span>
                <span className="font-semibold">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-between font-bold mt-4 pt-4 border-t border-border">
            <span>Total</span>
            <span className="text-primary">{formatPrice(order.totalAmount)}</span>
          </div>
          {order.notes && (
            <div className="mt-4 rounded-xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Note: </span>
              {order.notes}
            </div>
          )}
        </div>

        {/* WhatsApp */}
        <div className="rounded-3xl bg-card border border-border p-8 space-y-3">
          <h2 className="font-heading font-bold text-lg">Contact vendor</h2>
          <p className="text-sm text-muted-foreground">
            Send your order details to the vendor via WhatsApp to confirm and get
            updates.
          </p>
          <WhatsAppButton
            vendorPhone={order.vendorWhatsappNumber}
            order={{
              orderId: order.orderId,
              customerName: order.customerName,
              items: order.items,
              total: order.totalAmount,
              notes: order.notes,
            }}
          />
        </div>
      </div>
    </main>
  );
}