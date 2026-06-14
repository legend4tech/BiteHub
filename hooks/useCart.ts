"use client"

import { useState, useEffect, useCallback, startTransition } from "react"
import type { CartItem, MenuItem } from "@/lib/types"
import { LS_CART } from "@/lib/constants"

// Added vendorWhatsappNumber to CartState so OrderForm can pass it to the API
// without needing to look up the vendor separately.
// Previously OrderForm called getVendorById() from static mock data —
// that broke for real DB vendors since they aren't in the local data file.
interface CartState {
  items: CartItem[]
  vendorId: string | null
  vendorName: string | null
  vendorWhatsappNumber: string | null
  vendorDeliveryFee: number
  vendorPrepTime: string | null
  vendorMonnifySubaccountCode: string | null
}

const EMPTY_CART: CartState = {
  items: [],
  vendorId: null,
  vendorName: null,
  vendorWhatsappNumber: null,
  vendorDeliveryFee: 0,
  vendorPrepTime: null,
  vendorMonnifySubaccountCode: null,
}

const CART_EVENT = "cb:cart:update"

let cachedCart: CartState | null = null

function readCart(): CartState {
  if (cachedCart) return cachedCart
  if (typeof window === "undefined") return EMPTY_CART
  try {
    const raw = localStorage.getItem(LS_CART)
    cachedCart = raw ? JSON.parse(raw) : EMPTY_CART
    return cachedCart!
  } catch {
    return EMPTY_CART
  }
}

function writeCart(state: CartState) {
  cachedCart = state
  localStorage.setItem(LS_CART, JSON.stringify(state))
  window.dispatchEvent(new Event(CART_EVENT))
}

export function useCart() {
  const [cart, setCart] = useState<CartState>(EMPTY_CART)

  useEffect(() => {
    const timer = setTimeout(() => setCart(readCart()), 0)
    const handler = () => {
      startTransition(() => {
        setCart(readCart())
      })
    }
    window.addEventListener(CART_EVENT, handler)
    return () => {
      clearTimeout(timer)
      window.removeEventListener(CART_EVENT, handler)
    }
  }, [])

  const persist = useCallback((next: CartState) => {
    writeCart(next)
    startTransition(() => {
      setCart(next)
    })
  }, [])

  const isDifferentVendor = useCallback(
    (menuItem: MenuItem) =>
      cart.vendorId !== null && cart.vendorId !== menuItem.vendorId,
    [cart.vendorId]
  )

  const addItem = useCallback(
    (menuItem: MenuItem, quantity = 1) => {
      const current = readCart()
      if (current.vendorId && current.vendorId !== menuItem.vendorId) return

      const existing = current.items.find(
        (ci) => ci.menuItem.id === menuItem.id
      )
      const items: CartItem[] = existing
        ? current.items.map((ci) =>
            ci.menuItem.id === menuItem.id
              ? { ...ci, quantity: ci.quantity + quantity }
              : ci
          )
        : [...current.items, { menuItem, quantity }]
      persist({
        items,
        vendorId: menuItem.vendorId,
        vendorName: menuItem.vendorName ?? null,
        // vendorWhatsappNumber comes from the menuItem — MenuItemCard and VendorMenu
        // pass the full item object which includes vendorWhatsappNumber when mapped
        // from the API response in the vendor detail page.
        vendorWhatsappNumber: menuItem.vendorWhatsappNumber ?? null,
        vendorDeliveryFee: menuItem.vendorDeliveryFee ?? 0,
        vendorPrepTime: menuItem.vendorPrepTime ?? null,
        vendorMonnifySubaccountCode: current.vendorMonnifySubaccountCode,
      })
    },
    [persist]
  )

  const clearAndAdd = useCallback(
    (menuItem: MenuItem, quantity = 1) => {
      persist({
        items: [{ menuItem, quantity }],
        vendorId: menuItem.vendorId,
        vendorName: menuItem.vendorName ?? null,
        vendorWhatsappNumber: menuItem.vendorWhatsappNumber ?? null,
        vendorDeliveryFee: menuItem.vendorDeliveryFee ?? 0,
        vendorPrepTime: menuItem.vendorPrepTime ?? null,
        vendorMonnifySubaccountCode: null, // Will be synced by checkout effect
      })
    },
    [persist]
  )

  const removeItem = useCallback(
    (menuItemId: string) => {
      const current = readCart()
      const items = current.items.filter((ci) => ci.menuItem.id !== menuItemId)
      persist(items.length === 0 ? EMPTY_CART : { ...current, items })
    },
    [persist]
  )

  const updateQuantity = useCallback(
    (menuItemId: string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(menuItemId)
        return
      }
      const current = readCart()
      persist({
        ...current,
        items: current.items.map((ci) =>
          ci.menuItem.id === menuItemId ? { ...ci, quantity } : ci
        ),
      })
    },
    [persist, removeItem]
  )

  const clearCart = useCallback(() => persist(EMPTY_CART), [persist])

  const syncVendorDetails = useCallback(
    (
      vendorId: string,
      deliveryFee: number,
      prepTime?: string,
      monnifySubaccountCode?: string
    ) => {
      const current = readCart()
      if (
        current.vendorId === vendorId &&
        (current.vendorDeliveryFee !== deliveryFee ||
          (prepTime !== undefined && current.vendorPrepTime !== prepTime) ||
          (monnifySubaccountCode !== undefined &&
            current.vendorMonnifySubaccountCode !== monnifySubaccountCode))
      ) {
        persist({
          ...current,
          vendorDeliveryFee: deliveryFee,
          vendorPrepTime:
            prepTime !== undefined ? prepTime : current.vendorPrepTime,
          vendorMonnifySubaccountCode:
            monnifySubaccountCode !== undefined
              ? monnifySubaccountCode
              : current.vendorMonnifySubaccountCode,
        })
      }
    },
    [persist]
  )

  const total = cart.items.reduce(
    (sum, ci) => sum + ci.menuItem.price * ci.quantity,
    cart.vendorDeliveryFee
  )
  const count = cart.items.reduce((sum, ci) => sum + ci.quantity, 0)

  return {
    cart,
    addItem,
    clearAndAdd,
    removeItem,
    updateQuantity,
    clearCart,
    syncVendorDetails,
    isDifferentVendor,
    total,
    count,
    isEmpty: cart.items.length === 0,
  }
}
