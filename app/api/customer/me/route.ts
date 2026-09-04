import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import dbConnect from "@/lib/db"
import Customer from "@/models/Customer"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email || session.user.role !== "customer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    const customer = await Customer.findOne({ email: session.user.email })

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    return NextResponse.json({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      preferredLandmark: customer.preferredLandmark,
      preferredSubLandmark: customer.preferredSubLandmark,
      preferredLocation: customer.preferredLocation,
      preferredExactLocation: customer.preferredExactLocation,
    })
  } catch (error) {
    console.error("[CUSTOMER_ME_GET]", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email || session.user.role !== "customer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const {
      name,
      phone,
      preferredLandmark,
      preferredSubLandmark,
      preferredLocation,
      preferredExactLocation,
    } = body

    await dbConnect()

    const updatedCustomer = await Customer.findOneAndUpdate(
      { email: session.user.email },
      {
        $set: {
          ...(name && { name }),
          ...(phone && { phone }),
          ...(preferredLandmark !== undefined && { preferredLandmark }),
          ...(preferredSubLandmark !== undefined && { preferredSubLandmark }),
          ...(preferredLocation !== undefined && { preferredLocation }),
          ...(preferredExactLocation !== undefined && {
            preferredExactLocation,
          }),
        },
      },
      { new: true }
    )

    if (!updatedCustomer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      customer: {
        name: updatedCustomer.name,
        email: updatedCustomer.email,
        phone: updatedCustomer.phone,
        preferredLandmark: updatedCustomer.preferredLandmark,
        preferredSubLandmark: updatedCustomer.preferredSubLandmark,
        preferredLocation: updatedCustomer.preferredLocation,
        preferredExactLocation: updatedCustomer.preferredExactLocation,
      },
    })
  } catch (error) {
    console.error("[CUSTOMER_ME_PATCH]", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
