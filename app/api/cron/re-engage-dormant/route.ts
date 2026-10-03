import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    await dbConnect()

    // Dynamically import models and services
    const Customer = (await import("@/models/Customer")).default
    const { sendDormantCustomerEmail } = await import("@/lib/rewardMail")

    const now = new Date()

    // 30 days ago
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // 90 days ago
    const ninetyDaysAgo = new Date(now)
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    // 21 days ago
    const twentyOneDaysAgo = new Date(now)
    twentyOneDaysAgo.setDate(twentyOneDaysAgo.getDate() - 21)

    // Find active customers who ordered between 30 and 90 days ago
    // AND haven't been emailed in the last 21 days
    const dormantCustomers = await Customer.find({
      isActive: true,
      lastOrderAt: { $lt: thirtyDaysAgo, $gt: ninetyDaysAgo },
      $or: [
        { sentReEngagementAt: { $exists: false } },
        { sentReEngagementAt: { $lt: twentyOneDaysAgo } },
      ],
    })
      .select("email name _id")
      .lean()

    let emailsSent = 0

    if (dormantCustomers.length > 0) {
      for (const customer of dormantCustomers) {
        // Mongoose generic lean documents have `any` properties unless casted
        const email = customer.email as string | undefined
        const name = customer.name as string | undefined

        if (email && name) {
          try {
            const result = await sendDormantCustomerEmail(email, name)
            if (result.success) {
              await Customer.findByIdAndUpdate(customer._id, {
                $set: { sentReEngagementAt: now },
              })
              emailsSent++
            }
          } catch (e) {
            console.error(`Failed to re-engage customer ${customer._id}:`, e)
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      processed: dormantCustomers.length,
      emailsSent,
    })
  } catch (error) {
    console.error("Cron Error (Re-engage Dormant):", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
