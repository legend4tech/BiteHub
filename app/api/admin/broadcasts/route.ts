import { NextResponse, after } from "next/server"
import dbConnect from "@/lib/db"
import { auth } from "@/auth"
import { z } from "zod"
import Subscriber from "@/models/Subscriber"
import Customer from "@/models/Customer"
import Vendor from "@/models/Vendor"
import VendorUser from "@/models/VendorUser"
import { sendBroadcastEmails } from "@/lib/broadcastMail"

const broadcastSchema = z.object({
  subject: z.string().min(1),
  content: z.string().min(1),
  audiences: z.object({
    customers: z.boolean(),
    vendors: z.boolean(),
    subscribers: z.boolean(),
  }),
})

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (
      !session ||
      (session.user.role !== "admin" && session.user.role !== "superadmin")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const parsed = broadcastSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.format() },
        { status: 400 }
      )
    }

    const { subject, content, audiences } = parsed.data
    await dbConnect()

    // 1. Gather emails
    const emailSet = new Set<string>()

    if (audiences.customers) {
      const customers = await Customer.find(
        { receivesMarketing: true },
        "email"
      ).lean()
      customers.forEach((c) => emailSet.add(c.email))
    }

    if (audiences.vendors) {
      const vendors = await Vendor.find(
        { receivesMarketing: true },
        "_id"
      ).lean()
      const vendorIds = vendors.map((v) => v._id)
      const vendorUsers = await VendorUser.find(
        { vendorId: { $in: vendorIds }, isActive: true },
        "email"
      ).lean()
      vendorUsers.forEach((u) => emailSet.add(u.email))
    }

    if (audiences.subscribers) {
      const subscribers = await Subscriber.find(
        { isActive: true },
        "email"
      ).lean()
      subscribers.forEach((s) => emailSet.add(s.email))
    }

    const emails = Array.from(emailSet)

    if (emails.length === 0) {
      return NextResponse.json(
        { error: "No recipients found for selected audiences" },
        { status: 400 }
      )
    }

    // 2. Send emails in the background
    const adminEmail = session.user.email || undefined

    after(() => {
      sendBroadcastEmails(emails, subject, content, adminEmail).catch((err) => {
        console.error("[Background Broadcast Error]", err)
      })
    })

    // Return immediately to avoid timeouts
    return NextResponse.json({ success: true, count: emails.length })
  } catch (error) {
    console.error("[POST /api/admin/broadcasts]", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
