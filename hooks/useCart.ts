"use client";

import { useState, useEffect, useCallback } from "react";
import type { CartItem, CartState, MenuItem } from "@/lib/types";
import { LS_CART } from "@/lib/constants";

const EMPTY_CART: CartState = { items: [], vendorId: null, vendorName: null };

// Custom event used to broadcast cart changes to every useCart instance
// on the page (e.g. MenuItemCard ↔ CartSummary).
const CART_EVENT = "cb:cart:update";

function readCart(): CartState {
  if (typeof window === "undefined") return EMPTY_CART;
  try {
    const raw = localStorage.getItem(LS_CART);
    return raw ? JSON.parse(raw) : EMPTY_CART;
  } catch {
    return EMPTY_CART;
  }
}

function writeCart(state: CartState) {
  localStorage.setItem(LS_CART, JSON.stringify(state));
  // Notify every other useCart instance on this page immediately
  window.dispatchEvent(new Event(CART_EVENT));
}

export function useCart() {
  const [cart, setCart] = useState<CartState>(EMPTY_CART);

  useEffect(() => {
    // Hydrate on mount
    setCart(readCart());
    // Listen for updates from other hook instances (e.g. MenuItemCard → CartSummary)
    const handler = () => setCart(readCart());
    window.addEventListener(CART_EVENT, handler);
    return () => window.removeEventListener(CART_EVENT, handler);
  }, []);

  const persist = useCallback((next: CartState) => {
    writeCart(next); // broadcasts CART_EVENT → all instances re-sync
    setCart(next);   // optimistic update for the calling component
  }, []);

  const isDifferentVendor = useCallback(
    (menuItem: MenuItem) =>
      cart.vendorId !== null && cart.vendorId !== menuItem.vendorId,
    [cart.vendorId]
  );

  const addItem = useCallback(
    (menuItem: MenuItem, quantity = 1) => {
      const current = readCart();
      if (current.vendorId && current.vendorId !== menuItem.vendorId) return;
      const existing = current.items.find((ci) => ci.menuItem.id === menuItem.id);
      const items: CartItem[] = existing
        ? current.items.map((ci) =>
            ci.menuItem.id === menuItem.id
              ? { ...ci, quantity: ci.quantity + quantity }
              : ci
          )
        : [...current.items, { menuItem, quantity }];
      persist({ items, vendorId: menuItem.vendorId, vendorName: menuItem.vendorName || null });
    },
    [persist]
  );

  const clearAndAdd = useCallback(
    (menuItem: MenuItem, quantity = 1) => {
      persist({
        items: [{ menuItem, quantity }],
        vendorId: menuItem.vendorId,
        vendorName: menuItem.vendorName || null,
      });
    },
    [persist]
  );

  const removeItem = useCallback(
    (menuItemId: string) => {
      const current = readCart();
      const items = current.items.filter((ci) => ci.menuItem.id !== menuItemId);
      persist(items.length === 0 ? EMPTY_CART : { ...current, items });
    },
    [persist]
  );

  const updateQuantity = useCallback(
    (menuItemId: string, quantity: number) => {
      if (quantity <= 0) { removeItem(menuItemId); return; }
      const current = readCart();
      persist({
        ...current,
        items: current.items.map((ci) =>
          ci.menuItem.id === menuItemId ? { ...ci, quantity } : ci
        ),
      });
    },
    [persist, removeItem]
  );

  const clearCart = useCallback(() => persist(EMPTY_CART), [persist]);

  const total = cart.items.reduce((sum, ci) => sum + ci.menuItem.price * ci.quantity, 0);
  const count = cart.items.reduce((sum, ci) => sum + ci.quantity, 0);

  return {
    cart,
    addItem,
    clearAndAdd,
    removeItem,
    updateQuantity,
    clearCart,
    isDifferentVendor,
    total,
    count,
    isEmpty: cart.items.length === 0,
  };
}
