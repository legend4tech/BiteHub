import Vendor, { IVendor } from "@/models/Vendor"
import MenuItem, { IMenuItem } from "@/models/MenuItem"
import Landmark from "@/models/Landmark"
import SubLandmark from "@/models/SubLandmark"
import {
  getPrepTimeInHours,
  isPreorderPrepTime,
  formatPrepTime,
  isItemAvailableToday,
} from "@/lib/format"
import dbConnect from "@/lib/db"

export async function resolveDeliveryFee(
  vendor: Partial<IVendor>,
  location: string
): Promise<number> {
  await dbConnect()
  let deliveryFee = vendor.deliveryFee || 0

  const landmarks = await Landmark.find({
    school: vendor.school,
    campus: vendor.campus,
  }).lean()

  const subLandmarks = await SubLandmark.find({
    landmarkId: { $in: landmarks.map((l: { _id: unknown }) => l._id) },
  }).lean()

  let deliveryZoneMatched = false
  for (const lm of landmarks) {
    if (location === lm.name) {
      const vendorLmOverride = vendor.landmarkOverrides?.find(
        (o: { landmarkId: unknown; fee: number }) =>
          String(o.landmarkId) === String(lm._id)
      )
      if (vendorLmOverride) {
        deliveryFee = vendorLmOverride.fee
      } else {
        deliveryFee = lm.defaultDeliveryFee
      }
      deliveryZoneMatched = true
      break
    }

    for (const sub of subLandmarks) {
      if (
        String(sub.landmarkId) === String(lm._id) &&
        location === `${lm.name} - ${sub.name}`
      ) {
        const vendorSubOverride = vendor.subLandmarkOverrides?.find(
          (o: { subLandmarkId: unknown; fee: number }) =>
            String(o.subLandmarkId) === String(sub._id)
        )
        const vendorLmOverride = vendor.landmarkOverrides?.find(
          (o: { landmarkId: unknown; fee: number }) =>
            String(o.landmarkId) === String(lm._id)
        )

        if (vendorSubOverride) {
          deliveryFee = vendorSubOverride.fee
        } else if (vendorLmOverride) {
          deliveryFee = vendorLmOverride.fee
        } else if (
          sub.defaultDeliveryFee !== undefined &&
          sub.defaultDeliveryFee !== null
        ) {
          deliveryFee = sub.defaultDeliveryFee
        } else {
          deliveryFee = lm.defaultDeliveryFee
        }
        deliveryZoneMatched = true
        break
      }
    }
    if (deliveryZoneMatched) break
  }

  return deliveryFee
}

export async function validateOrderItemsAndCalculateTotal(
  items: Array<{
    menuItemId: string
    name: string
    quantity: number
    price?: number
  }>,
  vendorId: string,
  deliveryFee: number
) {
  await dbConnect()
  let calculatedTotal = deliveryFee
  const itemIds = items.map((item) => item.menuItemId)
  const dbMenuItems = await MenuItem.find({
    _id: { $in: itemIds },
    vendorId,
  }).lean()

  const dbMenuItemsMap = new Map<string, Partial<IMenuItem>>(
    dbMenuItems.map((item: Partial<IMenuItem>) => [String(item._id), item])
  )

  const lagosDate = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Africa/Lagos" })
  )
  const currentHourStr = lagosDate.getHours().toString().padStart(2, "0")
  const currentMinStr = lagosDate.getMinutes().toString().padStart(2, "0")
  const currentTimeStr = `${currentHourStr}:${currentMinStr}`

  let maxHours = -1
  let maxItemPrepTime = ""

  for (const item of items) {
    const dbItem = dbMenuItemsMap.get(item.menuItemId)
    if (!dbItem) {
      throw new Error(`Menu item not found: ${item.name}`)
    }

    if (dbItem.isAvailable === false) {
      throw new Error(
        `Sorry, ${dbItem.name} is currently out of stock or unavailable.`
      )
    }

    if (!isItemAvailableToday(dbItem.availableDays)) {
      throw new Error(`Sorry, ${dbItem.name} is not available today.`)
    }

    if (
      dbItem.quantityAvailable !== null &&
      dbItem.quantityAvailable !== undefined
    ) {
      if (dbItem.quantityAvailable < item.quantity) {
        throw new Error(
          `Sorry, only ${dbItem.quantityAvailable} portions of ${dbItem.name} are available. Please reduce your quantity.`
        )
      }
    }

    if (dbItem.availableFrom && currentTimeStr < dbItem.availableFrom) {
      throw new Error(
        `Sorry, ${dbItem.name} is only available starting from ${dbItem.availableFrom}.`
      )
    }
    if (dbItem.availableTo && currentTimeStr > dbItem.availableTo) {
      throw new Error(
        `Sorry, ${dbItem.name} is no longer available (ended at ${dbItem.availableTo}).`
      )
    }

    if (dbItem.prepTimeValue && dbItem.prepTimeUnit) {
      const hours = getPrepTimeInHours(
        dbItem.prepTimeValue,
        dbItem.prepTimeUnit
      )

      if (hours > maxHours) {
        maxHours = hours
        const isPreorder = isPreorderPrepTime(
          dbItem.prepTimeValue,
          dbItem.prepTimeUnit
        )
        maxItemPrepTime = isPreorder
          ? `Pre-order: ${formatPrepTime(dbItem.prepTimeValue, dbItem.prepTimeUnit)}`
          : `${formatPrepTime(dbItem.prepTimeValue, dbItem.prepTimeUnit)}`
      }
    }

    calculatedTotal += (dbItem.price || 0) * item.quantity
    item.price = dbItem.price || 0
  }

  return {
    calculatedTotal,
    maxHours,
    maxItemPrepTime,
    dbMenuItemsMap,
  }
}
