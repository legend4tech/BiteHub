/**
 * checkoutStockService.ts
 *
 * Handles atomic inventory decrements and low-stock notification triggers
 * within the checkout database transaction.
 */

import type mongoose from "mongoose"
import MenuItem, { type IMenuItem } from "@/models/MenuItem"
import { LOW_STOCK_THRESHOLD } from "@/lib/constants"
import { sendVendorLowStockAlertEmail } from "@/lib/vendorAlertMail"

export interface ReserveStockParams {
  items: {
    menuItemId: string
    quantity: number
  }[]
  dbMenuItemsMap: Map<string, Partial<IMenuItem>>
  vendorId: string
  finalVendorName: string
  mongooseSession: mongoose.ClientSession
}

export async function reserveStockAndAlertVendors({
  items,
  dbMenuItemsMap,
  vendorId,
  finalVendorName,
  mongooseSession,
}: ReserveStockParams): Promise<void> {
  const trackedItems = items.filter((item) => {
    const dbItem = dbMenuItemsMap.get(item.menuItemId)
    return (
      dbItem &&
      dbItem.quantityAvailable !== null &&
      dbItem.quantityAvailable !== undefined
    )
  })

  if (trackedItems.length === 0) return

  const bulkOps = trackedItems.map((item) => {
    const dbItem = dbMenuItemsMap.get(item.menuItemId)!
    const updateDoc: {
      $inc: { quantityAvailable: number }
      $set?: { lowStockAlertSent: boolean }
    } = { $inc: { quantityAvailable: -item.quantity } }

    const newQuantity = (dbItem.quantityAvailable || 0) - item.quantity
    if (newQuantity <= LOW_STOCK_THRESHOLD && !dbItem.lowStockAlertSent) {
      updateDoc.$set = { lowStockAlertSent: true }
      // Fire-and-forget low stock alert
      sendVendorLowStockAlertEmail(
        vendorId,
        finalVendorName,
        dbItem.name || "Unknown Item",
        newQuantity
      ).catch((err) =>
        console.error("[POST /api/orders] Low stock alert failed:", err)
      )
    }

    return {
      updateOne: {
        filter: {
          _id: item.menuItemId,
          quantityAvailable: { $gte: item.quantity },
        },
        update: updateDoc,
      },
    }
  })

  const bulkRes = await MenuItem.bulkWrite(bulkOps, {
    session: mongooseSession,
  })

  if (bulkRes.modifiedCount < trackedItems.length) {
    throw new Error(
      "One or more items in your cart just went out of stock. Please adjust your quantity."
    )
  }
}
