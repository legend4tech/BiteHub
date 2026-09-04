import { auth } from "@/auth"
import { getVendorMenuItems } from "@/lib/services/menuService"
import { VendorMenuManagement } from "@/components/vendor-dashboard/VendorMenuManagement"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import type { MenuItem } from "@/types/vendor"

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function VendorMenuPage({ searchParams }: Props) {
  const session = await auth()
  if (!session || session.user?.role !== "vendor" || !session.user?.vendorId) {
    redirect("/vendor/login")
  }

  const resolvedParams = await searchParams
  const activeCategory =
    typeof resolvedParams.category === "string"
      ? resolvedParams.category
      : "all"
  const search =
    typeof resolvedParams.search === "string" ? resolvedParams.search : ""

  const vendorId = session.user.vendorId

  const { allItems, filteredItems } = await getVendorMenuItems(
    vendorId,
    search,
    activeCategory
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Menu Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Add, edit, or remove items from your store
          </p>
        </div>
        <Button variant="hero" asChild className="gap-2">
          <Link href="/vendor/menu/new">
            <Plus className="size-4" /> Add Item
          </Link>
        </Button>
      </div>

      <VendorMenuManagement
        initialItems={filteredItems}
        allItems={allItems}
        activeCategory={activeCategory}
      />
    </div>
  )
}
