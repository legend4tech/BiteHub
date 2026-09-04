import { auth } from "@/auth"
import { redirect } from "next/navigation"
import dbConnect from "@/lib/db"
import Order from "@/models/Order"
import { formatPrice } from "@/lib/format"
import { ShoppingBag } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import type { OrderRecord } from "@/types/customer"

export default async function CustomerOrdersPage() {
  const session = await auth()
  if (!session?.user?.email || session.user.role !== "customer") {
    redirect("/customer/login")
  }

  await dbConnect()

  const orders = await Order.find({ customerEmail: session.user.email })
    .sort({ createdAt: -1 })
    .lean()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">My Orders</h1>
          <p className="text-muted-foreground">
            View your past orders and their status.
          </p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
          <ShoppingBag className="mx-auto mb-4 size-10 text-muted-foreground/50" />
          <h3 className="text-lg font-bold">No orders found</h3>
          <p className="mb-4 text-muted-foreground">
            You haven&apos;t placed any orders yet.
          </p>
          <Button asChild variant="hero">
            <Link href="/">Browse Menus</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order: OrderRecord) => (
            <div
              key={order._id.toString()}
              className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
            >
              <div className="flex flex-col border-b border-border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-bold text-foreground">
                    {order.vendorName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Order ID: {order.orderId} •{" "}
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="mt-2 flex items-center justify-between gap-4 sm:mt-0 sm:justify-end">
                  <p className="font-bold text-primary">
                    {formatPrice(order.totalAmount)}
                  </p>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${
                      order.status === "completed"
                        ? "bg-success/10 text-success"
                        : order.status === "cancelled"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-accent text-foreground"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <div className="space-y-2">
                  {order.items.map(
                    (
                      item: { name: string; quantity: number; price: number },
                      i: number
                    ) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {item.quantity}x {item.name}
                        </span>
                        <span className="font-medium text-foreground">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    )
                  )}
                </div>
                <div className="mt-4 flex justify-between border-t border-border pt-4 text-sm">
                  <span className="font-medium text-muted-foreground">
                    Delivery to: {order.location}
                  </span>
                  <span className="font-medium text-foreground">
                    {order.items.length} items
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
