import { describe, it, expect, vi, beforeEach, afterAll } from "vitest"
import { GET } from "@/app/api/cron/order-attention/route"
import Order from "@/models/Order"
import AdminUser from "@/models/AdminUser"
import VendorUserModel from "@/models/VendorUser"
import * as orderMail from "@/lib/orderMail"
import { render } from "@react-email/render"
import React from "react"
import VendorOrderReminderEmail from "@/emails/VendorOrderReminderEmail"

vi.mock("@/lib/db", () => ({
  default: vi.fn().mockResolvedValue(true),
}))

vi.mock("@/models/Order", () => ({
  default: {
    find: vi.fn(),
    findByIdAndUpdate: vi.fn().mockResolvedValue(true),
    findOneAndUpdate: vi.fn().mockResolvedValue(true),
  },
}))

vi.mock("@/models/AdminUser", () => ({
  default: {
    find: vi.fn(),
  },
}))

vi.mock("@/models/VendorUser", () => ({
  default: {
    findOne: vi.fn(),
  },
}))

vi.mock("@/lib/orderMail", () => ({
  sendAdminOrderAttentionEmail: vi.fn().mockResolvedValue({ success: true }),
  sendVendorOrderReminderEmail: vi.fn().mockResolvedValue({ success: true }),
}))

describe("Order Attention & Escalation Cron (/api/cron/order-attention)", () => {
  const env = process.env as Record<string, string | undefined>
  const originalSecret = env.CRON_SECRET

  beforeEach(() => {
    vi.clearAllMocks()
    env.CRON_SECRET = "test_cron_secret_attention_123"
  })

  afterAll(() => {
    env.CRON_SECRET = originalSecret
  })

  it("rejects unauthorized requests without CRON_SECRET with 401", async () => {
    const unauthReq = new Request(
      "https://bitehubapp.com/api/cron/order-attention"
    )
    const res = await GET(unauthReq)
    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.error).toBe("Unauthorized")
  })

  it("rejects requests with invalid or short authorization headers with 401", async () => {
    const wrongReq = new Request(
      "https://bitehubapp.com/api/cron/order-attention",
      {
        headers: { authorization: "Bearer invalid_secret" },
      }
    )
    const res = await GET(wrongReq)
    expect(res.status).toBe(401)
  })

  it("skips when no active paid orders are found", async () => {
    vi.mocked(AdminUser.find).mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi
          .fn()
          .mockResolvedValue([
            { email: "admin@bitehub.com", name: "Super Admin", role: "admin" },
          ]),
      }),
    } as unknown as ReturnType<typeof AdminUser.find>)

    vi.mocked(Order.find).mockReturnValue({
      lean: vi.fn().mockResolvedValue([]),
    } as unknown as ReturnType<typeof Order.find>)

    const validReq = new Request(
      "https://bitehubapp.com/api/cron/order-attention",
      {
        headers: { authorization: "Bearer test_cron_secret_attention_123" },
      }
    )
    const res = await GET(validReq)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.activeOrdersCount).toBe(0)
    expect(json.alertsSent).toBe(0)
  })

  it("escalates orders through Tier 1 (10m), Tier 2 (20m), and Tier 3 (60m)", async () => {
    const now = new Date()
    const nineMinsAgo = new Date(now.getTime() - 9 * 60 * 1000)
    const twelveMinsAgo = new Date(now.getTime() - 12 * 60 * 1000)
    const twentyFiveMinsAgo = new Date(now.getTime() - 25 * 60 * 1000)
    const seventyMinsAgo = new Date(now.getTime() - 70 * 60 * 1000)

    const mockOrders = [
      // 1. Paid 9m ago -> not yet 10m -> no alert
      {
        _id: "order_1",
        orderId: "BH-1001",
        vendorId: "v_1",
        vendorName: "Campus Burger",
        createdAt: nineMinsAgo,
        attentionAlertLevel: 0,
        status: "preparing",
        items: [{ name: "Burger", quantity: 1, priceInKobo: 200000 }],
        totalAmountInKobo: 200000,
      },
      // 2. Paid 12m ago -> Tier 1 (10m) alert
      {
        _id: "order_2",
        orderId: "BH-1002",
        vendorId: "v_1",
        vendorName: "Campus Burger",
        createdAt: twelveMinsAgo,
        attentionAlertLevel: 0,
        status: "pending",
        items: [{ name: "Shawarma", quantity: 2, priceInKobo: 150000 }],
        totalAmountInKobo: 300000,
      },
      // 3. Paid 25m ago, already had Tier 1 -> Tier 2 (20m) alert
      {
        _id: "order_3",
        orderId: "BH-1003",
        vendorId: "v_2",
        vendorName: "Mama Put",
        createdAt: twentyFiveMinsAgo,
        attentionAlertLevel: 1,
        status: "confirmed",
        items: [{ name: "Jollof Rice", quantity: 1, priceInKobo: 250000 }],
        totalAmountInKobo: 250000,
      },
      // 4. Paid 70m ago, already had Tier 2 -> Tier 3 (60m) critical alert
      {
        _id: "order_4",
        orderId: "BH-1004",
        vendorId: "v_2",
        vendorName: "Mama Put",
        createdAt: seventyMinsAgo,
        attentionAlertLevel: 2,
        status: "preparing",
        items: [{ name: "Fried Rice", quantity: 1, priceInKobo: 250000 }],
        totalAmountInKobo: 250000,
      },
      // 5. Paid 75m ago, ALREADY had Tier 3 -> should NOT alert again (idempotent)
      {
        _id: "order_5",
        orderId: "BH-1005",
        vendorId: "v_1",
        vendorName: "Campus Burger",
        createdAt: seventyMinsAgo,
        attentionAlertLevel: 3,
        status: "preparing",
        items: [],
        totalAmountInKobo: 100000,
      },
    ]

    vi.mocked(AdminUser.find).mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          {
            email: "admin@bitehub.com",
            name: "Super Admin",
            role: "superadmin",
          },
          {
            email: "manager@bitehub.com",
            name: "Vendor Manager",
            role: "vendor_manager",
          },
        ]),
      }),
    } as unknown as ReturnType<typeof AdminUser.find>)

    vi.mocked(Order.find).mockReturnValue({
      lean: vi.fn().mockResolvedValue(mockOrders),
    } as unknown as ReturnType<typeof Order.find>)

    vi.mocked(VendorUserModel.findOne).mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({ email: "vendor@kitchen.com" }),
      }),
    } as unknown as ReturnType<typeof VendorUserModel.findOne>)

    const validReq = new Request(
      "https://bitehubapp.com/api/cron/order-attention",
      {
        headers: { authorization: "Bearer test_cron_secret_attention_123" },
      }
    )

    const res = await GET(validReq)
    expect(res.status).toBe(200)
    const json = await res.json()

    expect(json.success).toBe(true)
    expect(json.alertsSent).toBe(3) // order_2, order_3, order_4
    expect(json.breakdown.tier1_10m).toBe(1)
    expect(json.breakdown.tier2_20m).toBe(1)
    expect(json.breakdown.tier3_60m).toBe(1)

    // Verify operations team received alerts with both admin & vendor manager emails
    expect(orderMail.sendAdminOrderAttentionEmail).toHaveBeenCalledTimes(3)
    expect(orderMail.sendAdminOrderAttentionEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        recipients: ["admin@bitehub.com", "manager@bitehub.com"],
        orderId: "BH-1002",
        tier: 1,
      })
    )

    // Verify vendor received their direct kitchen reminders with currentStatus
    expect(orderMail.sendVendorOrderReminderEmail).toHaveBeenCalledTimes(3)
    expect(orderMail.sendVendorOrderReminderEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        vendorEmail: "vendor@kitchen.com",
        orderId: "BH-1002",
        tier: 1,
        currentStatus: "pending",
      })
    )

    // Verify atomic concurrency locks
    expect(Order.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ _id: "order_2" }),
      expect.objectContaining({
        $set: expect.objectContaining({ attentionAlertLevel: 1 }),
      }),
      { new: true }
    )
    expect(Order.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ _id: "order_3" }),
      expect.objectContaining({
        $set: expect.objectContaining({ attentionAlertLevel: 2 }),
      }),
      { new: true }
    )
    expect(Order.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ _id: "order_4" }),
      expect.objectContaining({
        $set: expect.objectContaining({ attentionAlertLevel: 3 }),
      }),
      { new: true }
    )
  })

  it("renders tailored delivery dispatch copy for orders in READY status", async () => {
    const html = await render(
      React.createElement(VendorOrderReminderEmail, {
        orderId: "BH-READY-1",
        tier: 1,
        elapsedMinutes: 12,
        currentStatus: "ready",
        vendorName: "Campus Grill",
        customerName: "David",
        deliveryLocation: "Hostel Hall 3",
        items: [{ name: "Burger", quantity: 1, priceInKobo: 200000 }],
        vendorRevenueInKobo: 200000,
        vendorDashboardUrl: "https://bitehubapp.com/vendor/orders",
      })
    )

    expect(html).toContain("Dispatch &amp; Delivery Required")
    expect(html).toContain(
      "Meal Prepared — Please Dispatch / Deliver to Student"
    )
    expect(html).toContain("awaiting delivery to Hostel Hall 3")
    expect(html).toContain("Already Prepared &amp; Delivered?")
  })

  it("vendor reminder email template explicitly contains delivery completion prompt", async () => {
    const html = await render(
      React.createElement(VendorOrderReminderEmail, {
        orderId: "BH-9999",
        tier: 1,
        elapsedMinutes: 15,
        vendorName: "Campus Grill",
        customerName: "David",
        deliveryLocation: "Hostel Hall 3",
        items: [{ name: "Chicken Wings", quantity: 2, priceInKobo: 300000 }],
        vendorRevenueInKobo: 550000,
        vendorDashboardUrl: "https://bitehubapp.com/vendor/orders",
      })
    )

    // Verify key phrases requested by user
    expect(html).toContain("Already Prepared &amp; Delivered?")
    expect(html).toContain("mark it as")
    expect(html).toContain("Completed")
    expect(html).toContain("so your payout can be disbursed")
  })

  it("skips pre-orders entirely from instant 10m/20m/60m watchdog alerts", async () => {
    const twoHoursAgo = new Date(Date.now() - 120 * 60 * 1000)
    const mockPreorders = [
      {
        _id: "preorder_1",
        orderId: "BH-PRE-1",
        vendorId: "vendor_1",
        vendorName: "Campus Grill",
        customerName: "David",
        createdAt: twoHoursAgo,
        attentionAlertLevel: 0,
        status: "confirmed",
        isPreorder: true,
        vendorPrepTime: "Pre-order",
        items: [],
        totalAmountInKobo: 500000,
      },
      {
        _id: "preorder_2",
        orderId: "BH-PRE-2",
        vendorId: "vendor_1",
        vendorName: "Campus Grill",
        customerName: "Sarah",
        createdAt: twoHoursAgo,
        attentionAlertLevel: 0,
        status: "preparing",
        vendorPrepTime: "Delivery: Tomorrow at 2:00 PM",
        items: [],
        totalAmountInKobo: 800000,
      },
    ]

    vi.mocked(AdminUser.find).mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi
          .fn()
          .mockResolvedValue([
            { email: "admin@bitehub.com", name: "Super Admin", role: "admin" },
          ]),
      }),
    } as unknown as ReturnType<typeof AdminUser.find>)

    vi.mocked(Order.find).mockReturnValue({
      lean: vi.fn().mockResolvedValue(mockPreorders),
    } as unknown as ReturnType<typeof Order.find>)

    const validReq = new Request(
      "https://bitehubapp.com/api/cron/order-attention",
      {
        headers: { authorization: "Bearer test_cron_secret_attention_123" },
      }
    )

    const res = await GET(validReq)
    expect(res.status).toBe(200)
    const json = await res.json()

    expect(json.success).toBe(true)
    expect(json.alertsSent).toBe(0)
    expect(orderMail.sendAdminOrderAttentionEmail).not.toHaveBeenCalled()
    expect(orderMail.sendVendorOrderReminderEmail).not.toHaveBeenCalled()
  })
})
