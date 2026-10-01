import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { getAdminCustomers } from "@/lib/services/customerService"

// GET — all customers with pagination and search
export async function GET(request: Request) {
  try {
    const session = await auth()
    if (
      !session ||
      !["admin", "superadmin"].includes(session.user?.role || "")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || "20", 10)
    const search = searchParams.get("search") || ""

    const result = await getAdminCustomers(page, limit, search)

    return NextResponse.json(result)
  } catch (error) {
    console.error("[admin/customers GET]", error)
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    )
  }
}
