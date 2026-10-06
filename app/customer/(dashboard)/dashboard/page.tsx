import { auth } from "@/auth"

import Image from "next/image"
import {
  Wallet as WalletIcon,
  ShoppingBag,
  Gift,
  User,
  ArrowRight,
} from "lucide-react"
import { formatPriceExact } from "@/lib/format"
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
    <div className="space-y-6">
      <CustomerTermsChecker
        initialAcceptedVersion={customer.acceptedTermsVersion}
        currentVersion={CURRENT_TERMS_VERSION}
      />
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
                <span className="text-muted-foreground">Promo (BHC)</span>
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
                {toMajorUnit(promoBalance)}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  BHC
                </span>
              </h3>
              <ExpiringRewardsBanner rewards={expiringRewards} />
            </div>
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

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
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
            <div className="p-6">
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
        <div className="space-y-4 lg:col-span-5">
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
              action={{ label: "Order Food", href: "/" }}
              className="rounded-xl border border-dashed border-border bg-card/50"
            />
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              {recentOrders.map((order: OrderRecord, i: number) => (
                <div
                  key={order.id}
                  className={`flex items-center justify-between p-4 ${
                    i !== 0 ? "border-t border-border" : ""
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-muted p-2">
                      <ShoppingBag className="size-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold">
                        <span className="font-normal text-muted-foreground">
                          Ordered from:
                        </span>{" "}
                        {order.vendorName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()} •{" "}
                        {order.items.length} items
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">
                      {formatPriceExact(order.totalAmountInKobo)}
                    </p>
                    <div className="mt-1 flex justify-end">
                      <StatusBadge
                        status={order.status as OrderStatus}
                        paymentStatus={order.paymentStatus}
                        className="px-2 py-0.5 text-[10px] uppercase"
                      />
                    </div>
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
