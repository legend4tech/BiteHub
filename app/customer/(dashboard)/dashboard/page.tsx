import { auth } from "@/auth"

import Image from "next/image"
import {
  Wallet as WalletIcon,
  ShoppingBag,
  Gift,
  User,
  ArrowRight,
  Calendar,
  Receipt,
  UtensilsCrossed,
} from "lucide-react"
import { formatPriceExact } from "@/lib/format"
import { formatDate } from "@/lib/timeUtils"
import { toMajorUnit } from "@/lib/money"
import Link from "next/link"
import { EmptyState } from "@/components/shared/EmptyState"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { MilestonesProgress } from "@/components/customer/rewards/MilestonesProgress"
import type { OrderStatus } from "@/types/shared"
import type { OrderRecord } from "@/types/customer"
import {
  getCustomerByEmail,
  getCustomerWalletData,
} from "@/lib/services/customerService"
import {
  getRecentCustomerOrders,
  getCustomerOrdersCount,
} from "@/lib/services/orderService"
import { CURRENT_TERMS_VERSION } from "@/lib/constants"
import { CustomerTermsChecker } from "@/components/customer/dashboard/CustomerTermsChecker"
import { ExpiringRewardsBanner } from "@/components/customer/rewards/ExpiringRewardsBanner"

export const dynamic = "force-dynamic"

export default async function CustomerDashboardPage() {
  const session = await auth()
  if (!session?.user?.email) {
    return null
  }

  const customer = await getCustomerByEmail(session.user.email)
  if (!customer) {
    return null
  }

  const { wallet, expiringRewards } = await getCustomerWalletData(
    customer._id.toString()
  )

  // Fetch last 3 orders
  const recentOrders = await getRecentCustomerOrders(session.user.email, 3)

  const walletBalance = wallet ? wallet.balanceInKobo : 0
  const promoBalance = wallet ? wallet.promoBalanceInKobo || 0 : 0
  const depositBalance = wallet ? wallet.depositBalanceInKobo || 0 : 0
  const orderCount = await getCustomerOrdersCount(session.user.email)

  return (
    <div className="space-y-6 pb-12">
      <CustomerTermsChecker
        initialAcceptedVersion={customer.acceptedTermsVersion}
        currentVersion={CURRENT_TERMS_VERSION}
      />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {customer.image ? (
            <div className="size-16 shrink-0 overflow-hidden rounded-full border-2 border-border shadow-sm">
              <Image
                src={customer.image}
                alt={customer.name}
                width={64}
                height={64}
                className="size-full object-cover"
              />
            </div>
          ) : (
            <div className="flex size-16 shrink-0 items-center justify-center rounded-full border-2 border-border bg-primary/10 shadow-sm">
              <User className="size-8 text-primary" />
            </div>
          )}
          <div>
            <h1 className="font-heading text-2xl font-bold">
              Welcome back, {customer.name.split(" ")[0]}!
            </h1>
            <p className="text-muted-foreground">
              Here is what is happening with your account today.
            </p>
          </div>
        </div>

        <Button asChild className="gap-2 font-semibold shadow-xs sm:hidden">
          <Link href="/menus">
            <UtensilsCrossed className="size-4" />
            Browse Menus
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
                {formatPriceExact(walletBalance)}
              </h3>
            </div>
          </div>
          {wallet && (
            <div className="mt-4 space-y-1.5 rounded-lg bg-muted/40 px-3 py-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Deposited</span>
                <span className="font-semibold">
                  {formatPriceExact(depositBalance)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  BiteHub Coins (BHC)
                </span>
                <span className="font-semibold text-primary">
                  {formatPriceExact(promoBalance)}
                </span>
              </div>
            </div>
          )}
          <div className="mt-4 border-t border-border pt-4">
            {!wallet ? (
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href="/customer/wallet">Activate Wallet</Link>
              </Button>
            ) : (
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="w-full text-primary hover:bg-primary/5 hover:text-primary/80"
              >
                <Link href="/customer/wallet" className="flex items-center">
                  Fund Wallet <ArrowRight className="ml-1 size-4" />
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
              <Link href="/customer/orders" className="flex items-center">
                View History <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Rewards Card */}
        <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-6 shadow-sm sm:col-span-2 xl:col-span-1">
          <div>
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-status-ready/10 p-3">
                <Gift className="size-6 text-status-ready" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  BiteHub Coins
                </p>
                <h3 className="text-2xl font-bold">
                  {toMajorUnit(promoBalance)}{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    BHC
                  </span>
                </h3>
              </div>
            </div>
            {expiringRewards && expiringRewards.length > 0 && (
              <div className="mt-3">
                <ExpiringRewardsBanner rewards={expiringRewards} />
              </div>
            )}
          </div>
          <div className="mt-4 border-t border-border pt-4">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="w-full text-status-ready hover:bg-status-ready/5 hover:text-status-ready"
            >
              <Link href="/customer/rewards" className="flex items-center">
                Earn More <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-12">
        <div className="min-w-0 space-y-6 lg:col-span-7">
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            {/* Header Banner */}
            <div className="flex items-center justify-between border-b border-border bg-primary/5 px-6 py-4">
              <div className="flex items-center gap-4">
                <div className="relative size-12 shrink-0 sm:size-16">
                  <Image
                    src="/avatars/header_mascot.png"
                    alt="Rewards Mascot"
                    fill
                    className="object-contain"
                  />
                </div>
                <div>
                  <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-foreground">
                    <Gift className="size-5 text-primary" />
                    Active Milestones
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                    Complete challenges to earn Free Meals!
                  </p>
                </div>
              </div>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="hidden shrink-0 text-primary hover:bg-primary/10 sm:flex"
              >
                <Link href="/customer/rewards" className="flex items-center">
                  Rewards Hub <ArrowRight className="ml-1 size-4" />
                </Link>
              </Button>
            </div>

            {/* Content Area */}
            <div className="p-4 sm:p-6">
              <div className="mb-6 flex justify-end sm:hidden">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="w-full text-primary hover:bg-primary/10"
                >
                  <Link href="/customer/rewards" className="flex items-center">
                    Rewards Hub <ArrowRight className="ml-1 size-4" />
                  </Link>
                </Button>
              </div>
              <MilestonesProgress />
            </div>
          </div>
        </div>

        {/* Right Column: Recent Orders */}
        <div className="min-w-0 space-y-4 lg:col-span-5">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold">Recent Orders</h2>
            <Link
              href="/customer/orders"
              className="text-sm font-medium text-primary hover:underline"
            >
              View all
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <EmptyState
              size="sm"
              title="No orders yet"
              description="Start ordering your favorite meals!"
              action={{ label: "Order Food", href: "/menus" }}
              className="rounded-xl border border-dashed border-border bg-card/50"
            />
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order: OrderRecord) => (
                <div
                  key={order.id || order.orderId}
                  className="rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-xs"
                >
                  {/* Top row: Vendor Info & Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-2.5">
                      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <ShoppingBag className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[11px] font-medium text-muted-foreground">
                          Ordered from
                        </span>
                        <h3 className="font-heading text-sm font-bold break-words text-foreground">
                          {order.vendorName}
                        </h3>
                      </div>
                    </div>
                    <StatusBadge
                      status={order.status as OrderStatus}
                      paymentStatus={order.paymentStatus}
                      className="shrink-0 px-2 py-0.5 text-[11px] uppercase"
                    />
                  </div>

                  {/* Metadata: Order ID, Date, Item Count */}
                  <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Receipt className="size-3.5 text-primary" />
                      <Link
                        href={`/order/${order.orderId}`}
                        className="font-mono font-bold text-primary underline underline-offset-2 transition-colors hover:text-primary/80"
                      >
                        #{order.orderId}
                      </Link>
                    </span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="size-3.5" />
                      <span>{formatDate(order.createdAt)}</span>
                    </span>
                    <span>•</span>
                    <span>
                      {order.items.length}{" "}
                      {order.items.length === 1 ? "item" : "items"}
                    </span>
                  </div>

                  {/* Purchased items preview (wrap naturally, zero truncation) */}
                  {order.items && order.items.length > 0 && (
                    <p className="mt-2 text-xs leading-relaxed break-words text-muted-foreground">
                      {order.items
                        .map((it) => `${it.quantity}x ${it.name}`)
                        .join(", ")}
                    </p>
                  )}

                  {/* Bottom row: Total amount & Direct Track Order button */}
                  <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-2.5">
                    <div>
                      <span className="text-[10px] font-medium text-muted-foreground uppercase">
                        Total
                      </span>
                      <p className="font-heading text-base font-bold text-primary">
                        {formatPriceExact(order.totalAmountInKobo)}
                      </p>
                    </div>
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1 px-2.5 text-xs font-semibold text-primary hover:bg-primary/10 hover:text-primary"
                    >
                      <Link href={`/order/${order.orderId}`}>
                        Track Order <ArrowRight className="size-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
