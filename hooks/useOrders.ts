"use client";

import { useCallback } from "react";
import type { Order, OrderStatus, OrderItem } from "@/lib/types";
import { LS_ORDERS } from "@/lib/constants";
import { generateOrderId } from "@/lib/constants";

function readOrders(): Order[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_ORDERS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeOrders(orders: Order[]) {
  localStorage.setItem(LS_ORDERS, JSON.stringify(orders));
}

export function useOrders() {
  const placeOrder = useCallback(
    (data: {
      vendorId: string;
      vendorName: string;
      vendorPhone: string;
      items: OrderItem[];
      customerName: string;
      customerPhone: string;
      notes?: string;
      total: number;
    }): string => {
      const orderId = generateOrderId();
      const order: Order = {
        ...data,
        orderId,
        status: "pending",
        createdAt: new Date().toISOString(),
      };
      const orders = readOrders();
      writeOrders([order, ...orders]);
      return orderId;
    },
    []
  );

  const getOrder = useCallback((orderId: string): Order | null => {
    return readOrders().find((o) => o.orderId === orderId) ?? null;
  }, []);

  const getOrdersByVendor = useCallback((vendorId: string): Order[] => {
    return readOrders().filter((o) => o.vendorId === vendorId);
  }, []);

  const getAllOrders = useCallback((): Order[] => readOrders(), []);

  const updateStatus = useCallback(
    (orderId: string, status: OrderStatus): boolean => {
      const orders = readOrders();
      const idx = orders.findIndex((o) => o.orderId === orderId);
      if (idx === -1) return false;
      orders[idx] = { ...orders[idx], status };
      writeOrders(orders);
      return true;
    },
    []
  );

  return { placeOrder, getOrder, getOrdersByVendor, getAllOrders, updateStatus };
}
