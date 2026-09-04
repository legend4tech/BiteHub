"use client"

import { useState, useEffect, useCallback, startTransition } from "react"
import type { CartItem } from "@/types/customer"
import type { MenuItem } from "@/types/vendor"
import { LS_CART } from "@/lib/constants"
import { getPrepTimeInHours } from "@/lib/format"

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
    (
      menuItem: MenuItem,
      quantity = 1
    ): { success: boolean; error?: string } => {
      const current = readCart()
      if (current.vendorId && current.vendorId !== menuItem.vendorId) {
        return { success: false, error: "Different vendor" }
      }

      // Pre-order constraint
      const isIncomingPreorder = menuItem.isPreorder || false

      if (current.items.length > 0) {
        const existingItem = current.items[0].menuItem
        const existingIsPreorder = existingItem.isPreorder || false

        if (isIncomingPreorder !== existingIsPreorder) {
          return {
            success: false,
            error: isIncomingPreorder
              ? "Cannot mix pre-order items with instant delivery items. Please complete your current order first."
              : "Cannot mix instant items with your current pre-order cart. Please complete your current order first.",
          }
        }
      }

      const existing = current.items.find(
        (ci) => ci.menuItem.id === menuItem.id
      )

      const newQuantity = (existing ? existing.quantity : 0) + quantity
      if (
        menuItem.quantityAvailable !== null &&
        menuItem.quantityAvailable !== undefined &&
        newQuantity > menuItem.quantityAvailable
      ) {
        return {
          success: false,
          error: `Only ${menuItem.quantityAvailable} available.`,
        }
      }

      const items: CartItem[] = existing
        ? current.items.map((ci) =>
            ci.menuItem.id === menuItem.id
              ? { ...ci, menuItem, quantity: ci.quantity + quantity }
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

      return { success: true }
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
    (
      menuItemId: string,
      quantity: number
    ): { success: boolean; error?: string } | void => {
      if (quantity <= 0) {
        removeItem(menuItemId)
        return
      }
      const current = readCart()

      // Enforce limit synchronously
      const existingItem = current.items.find(
        (ci) => ci.menuItem.id === menuItemId
      )
      if (existingItem) {
        const maxQty = existingItem.menuItem.quantityAvailable
        if (maxQty !== null && maxQty !== undefined && quantity > maxQty) {
          return { success: false, error: `Only ${maxQty} available.` }
        }
      }

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

  // Calculate dynamic prep time
  let maxHours = -1
  let maxPrepItem: MenuItem | null = null
  let isPreorderCart = false

  for (const ci of cart.items) {
    const item = ci.menuItem
    if (item.isPreorder) {
      isPreorderCart = true
      // Preorders take precedence over prep times
      maxHours = 999999
      maxPrepItem = item
    } else if (item.prepTimeValue && item.prepTimeUnit) {
      const hours = getPrepTimeInHours(item.prepTimeValue, item.prepTimeUnit)
      if (hours > maxHours) {
        maxHours = hours
        maxPrepItem = item
      }
    }
  }

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
    maxPrepItem,
    isPreorderCart,
  }
}
