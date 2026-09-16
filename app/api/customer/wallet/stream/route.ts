import { NextRequest } from "next/server"
import { auth } from "@/auth"
import dbConnect from "@/lib/db"
import Customer from "@/models/Customer"
import { eventBus } from "@/lib/events"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) {
    return new Response("Unauthorized", { status: 401 })
  }

  await dbConnect()
  const customer = await Customer.findOne({ email: session.user.email })
    .select("_id")
    .lean()

  if (!customer) {
    return new Response("Customer not found", { status: 404 })
  }

  const customerId = customer._id.toString()

  const responseStream = new TransformStream()
  const writer = responseStream.writable.getWriter()
  const encoder = new TextEncoder()

  // Heartbeat to keep connection alive
  const heartbeatInterval = setInterval(() => {
    writer.write(encoder.encode(": heartbeat\n\n")).catch(() => {})
  }, 15000)

  // Listen for the global wallet_funded event
  const onWalletFunded = (fundedCustomerId: string) => {
    if (fundedCustomerId === customerId) {
      writer.write(encoder.encode(`data: update\n\n`)).catch(() => {})
    }
  }

  eventBus.on("wallet_funded", onWalletFunded)

  req.signal.addEventListener("abort", () => {
    clearInterval(heartbeatInterval)
    eventBus.off("wallet_funded", onWalletFunded)
    writer.close().catch(() => {})
  })

  return new Response(responseStream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  })
}
