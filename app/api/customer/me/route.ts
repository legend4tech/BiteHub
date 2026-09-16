import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import dbConnect from "@/lib/db"
import Customer from "@/models/Customer"
import { customerProfileUpdateSchema } from "@/lib/schemas"
import { deleteFromCloudinary } from "@/lib/cloudinary"

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
      school: customer.school,
      campus: customer.campus,
      preferredLandmark: customer.preferredLandmark,
      preferredSubLandmark: customer.preferredSubLandmark,
      preferredExactLocation: customer.preferredExactLocation,
      image: customer.image,
      imagePublicId: customer.imagePublicId,
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
    const parsedBody = customerProfileUpdateSchema.safeParse(body)

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parsedBody.error.format() },
        { status: 400 }
      )
    }

    const {
      name,
      phone,
      school,
      campus,
      preferredLandmark,
      preferredSubLandmark,
      preferredExactLocation,
      image,
      imagePublicId,
    } = parsedBody.data

    await dbConnect()

    const existingCustomer = await Customer.findOne({
      email: session.user.email,
    })
    if (!existingCustomer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    if (
      existingCustomer.imagePublicId &&
      imagePublicId !== undefined &&
      imagePublicId !== existingCustomer.imagePublicId
    ) {
      try {
        await deleteFromCloudinary(existingCustomer.imagePublicId)
      } catch (err) {
        console.error(
          "[PATCH /api/customer/me] Failed to delete old image",
          err
        )
      }
    }

    const updatedCustomer = await Customer.findOneAndUpdate(
      { email: session.user.email },
      {
        $set: {
          ...(name && { name }),
          ...(phone && { phone }),
          ...(school && { school }),
          ...(campus && { campus }),
          ...(preferredLandmark !== undefined && { preferredLandmark }),
          ...(preferredSubLandmark !== undefined && { preferredSubLandmark }),
          ...(preferredExactLocation !== undefined && {
            preferredExactLocation,
          }),
          ...(image !== undefined && { image }),
          ...(imagePublicId !== undefined && { imagePublicId }),
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
        school: updatedCustomer.school,
        campus: updatedCustomer.campus,
        preferredLandmark: updatedCustomer.preferredLandmark,
        preferredSubLandmark: updatedCustomer.preferredSubLandmark,
        preferredExactLocation: updatedCustomer.preferredExactLocation,
        image: updatedCustomer.image,
        imagePublicId: updatedCustomer.imagePublicId,
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
