import { auth } from "@/auth"
import { redirect } from "next/navigation"
import dbConnect from "@/lib/db"
import Customer from "@/models/Customer"
import Wallet from "@/models/Wallet"
import Order from "@/models/Order"
import { Wallet as WalletIcon, ShoppingBag, Gift } from "lucide-react"
import { formatPrice } from "@/lib/format"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface OrderRecord {
  _id: { toString: () => string }
  orderId: string
  vendorName: string
  totalAmount: number
  status: string
  createdAt: string | Date
  items: Array<{ name: string; quantity: number; price: number }>
}

export default async function CustomerDashboardPage() {
  const session = await auth()
  if (!session?.user?.email || session.user.role !== "customer") {
    redirect("/customer/login")
  }

  await dbConnect()
  const customer = await Customer.findOne({ email: session.user.email })
  if (!customer) {
    redirect("/customer/login")
  }

  const wallet = await Wallet.findOne({ customerId: customer._id })

  // Fetch last 3 orders
  const recentOrders = await Order.find({ customerEmail: session.user.email })
    .sort({ createdAt: -1 })
    .limit(3)
    .lean()

  const walletBalance = wallet ? wallet.balance : 0
  const orderCount = await Order.countDocuments({
    customerEmail: session.user.email,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">
          Welcome back, {customer.name.split(" ")[0]}!
        </h1>
        <p className="text-muted-foreground">
          Here is what is happening with your account today.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Wallet Card */}
        <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-primary/10 p-3">
              <WalletIcon className="size-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Wallet Balance
              </p>
              <h3 className="text-2xl font-bold">
                {formatPrice(walletBalance)}
              </h3>
            </div>
          </div>
          <div className="mt-4 border-t border-border pt-4">
            {!wallet ? (
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href="/customer/dashboard/wallet">Activate Wallet</Link>
              </Button>
            ) : (
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="w-full text-primary hover:bg-primary/5 hover:text-primary/80"
              >
                <Link href="/customer/dashboard/wallet">
                  Fund Wallet &rarr;
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Orders Card */}
        <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-info/10 p-3">
              <ShoppingBag className="size-6 text-info" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Orders
              </p>
              <h3 className="text-2xl font-bold">{orderCount}</h3>
            </div>
          </div>
          <div className="mt-4 border-t border-border pt-4">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="w-full text-info hover:bg-info/5 hover:text-info"
            >
              <Link href="/customer/dashboard/orders">View History &rarr;</Link>
            </Button>
          </div>
        </div>

        {/* Rewards Card */}
        <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-status-ready/10 p-3">
              <Gift className="size-6 text-status-ready" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                BiteHub Coins
              </p>
              <h3 className="text-2xl font-bold">
                0{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  BHC
                </span>
              </h3>
            </div>
          </div>
          <div className="mt-4 border-t border-border pt-4">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="w-full text-status-ready hover:bg-status-ready/5 hover:text-status-ready"
            >
              <Link href="/customer/dashboard/rewards">Earn More &rarr;</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Recent Orders List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold">Recent Orders</h2>
          <Link
            href="/customer/dashboard/orders"
            className="text-sm font-medium text-primary hover:underline"
          >
            View all
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
            <ShoppingBag className="mx-auto mb-3 size-8 text-muted-foreground/50" />
            <p className="text-sm font-medium text-muted-foreground">
              No orders yet
            </p>
            <Button asChild variant="hero" size="sm" className="mt-4">
              <Link href="/">Order Food</Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            {recentOrders.map((order: OrderRecord, i: number) => (
              <div
                key={order._id.toString()}
                className={`flex items-center justify-between p-4 ${
                  i !== 0 ? "border-t border-border" : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-muted p-2">
                    <ShoppingBag className="size-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold">{order.vendorName}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString()} •{" "}
                      {order.items.length} items
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">
                    {formatPrice(order.totalAmount)}
                  </p>
                  <span className="inline-flex items-center rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-foreground uppercase">
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
