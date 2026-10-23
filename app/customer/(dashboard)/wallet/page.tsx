export const dynamic = "force-dynamic"
import { auth } from "@/auth"
import Link from "next/link"
import { formatPriceExact } from "@/lib/format"
import { Wallet as WalletIcon, Landmark, Banknote } from "lucide-react"
import { EmptyState } from "@/components/shared/EmptyState"
import { Button } from "@/components/ui/button"
import { ActivateWalletForm } from "@/components/customer/ActivateWalletForm"
import { TransactionRow } from "@/components/customer/TransactionRow"
import { FundWalletFlow } from "@/components/customer/FundWalletFlow"
import type { Transaction } from "@/types/customer"
import {
  getCustomerByEmail,
  getCustomerWalletData,
} from "@/lib/services/customerService"
export default async function CustomerWalletPage() {
  const session = await auth()
  if (!session?.user?.email) {
    return null
  }
  const customer = await getCustomerByEmail(session.user.email)
  if (!customer) {
    return null
  }
  const { wallet, transactions } = await getCustomerWalletData(
    customer._id.toString()
  )
  const walletBalance = wallet ? wallet.balanceInKobo : 0
  const promoBalance = wallet ? wallet.promoBalanceInKobo || 0 : 0
  const depositBalance = wallet ? wallet.depositBalanceInKobo || 0 : 0
  const isActive = !!wallet?.accountNumber
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">My Wallet</h1>
        <p className="text-muted-foreground">
          Manage your funds and deposit money for seamless checkout.
        </p>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-3">
        {/* Balance & Actions */}
        <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm lg:col-span-1">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <WalletIcon className="size-5 text-primary" />
              </div>
              <p className="font-semibold text-muted-foreground">
                Available Balance
              </p>
            </div>
            <h2 className="text-4xl font-bold tracking-tight">
              {formatPriceExact(walletBalance)}
            </h2>
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
          </div>
          <div className="mt-8 border-t border-border pt-6">
            {!isActive ? (
              <ActivateWalletForm />
            ) : (
              <div className="flex flex-col gap-3">
                <Button
                  variant="outline"
                  className="w-full justify-start pl-4"
                  disabled
                >
                  <Banknote className="mr-3 size-4" /> Fund via Crypto (Coming
                  Soon)
                </Button>
              </div>
            )}
          </div>
        </div>
        {/* Deposit Info (Monnify Virtual Account) */}
        <div className="lg:col-span-2">
          {!isActive ? (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 font-heading text-lg font-bold">
                <Landmark className="size-5 text-primary" /> Virtual Bank
                Account
              </h3>
              <div className="flex h-40 flex-col items-center justify-center space-y-3 text-center">
                <div className="rounded-full border border-border bg-background p-3">
                  <Landmark className="size-6 text-muted-foreground" />
                </div>
                <p className="max-w-[250px] text-sm font-medium text-muted-foreground">
                  Activate your wallet to get a dedicated Monnify account number
                  for automatic funding.
                </p>
              </div>
            </div>
          ) : (
            <FundWalletFlow wallet={wallet} />
          )}
        </div>
      </div>
      {/* Transaction History */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold">
            Recent Transactions
          </h2>
          {transactions.length > 0 && (
            <Link
              href="/customer/transactions"
              className="text-sm font-medium text-primary hover:underline"
            >
              View all
            </Link>
          )}
        </div>
        {transactions.length === 0 ? (
          <EmptyState
            size="sm"
            title="No transactions yet"
            description="Your wallet history will appear here."
            className="rounded-xl border border-dashed border-border bg-card/50"
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            {transactions.map((tx: Transaction, i: number) => (
              <TransactionRow
                key={tx.id}
                tx={tx}
                customerName={customer.name}
                isFirst={i === 0}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
