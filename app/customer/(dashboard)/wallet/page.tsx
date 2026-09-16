export const dynamic = "force-dynamic"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { formatPriceExact } from "@/lib/format"
import {
  Wallet as WalletIcon,
  ArrowDownLeft,
  ArrowUpRight,
  Copy,
  Landmark,
  Banknote,
  Info,
} from "lucide-react"
import { EmptyState } from "@/components/shared/EmptyState"
import { Button } from "@/components/ui/button"
import { ActivateWalletForm } from "@/components/customer/ActivateWalletForm"
import { FundWalletFlow } from "@/components/customer/FundWalletFlow"
import { WalletAutoRefresher } from "@/components/customer/WalletAutoRefresher"
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

  const walletBalance = wallet ? wallet.balance : 0
  const isActive = !!wallet?.accountNumber

  return (
    <div className="space-y-6">
      <WalletAutoRefresher />
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
            {transactions.map((tx: Transaction, i: number) => {
              const isCredit =
                tx.type.includes("deposit") || tx.type === "reward"
              return (
                <div
                  key={tx.id}
                  className={`flex items-center justify-between p-4 ${
                    i !== 0 ? "border-t border-border" : ""
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`rounded-lg p-2 ${
                        isCredit
                          ? "bg-success/10 text-success"
                          : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {isCredit ? (
                        <ArrowDownLeft className="size-5" />
                      ) : (
                        <ArrowUpRight className="size-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.createdAt).toLocaleString()} • Ref:{" "}
                        {tx.reference}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-bold ${
                        isCredit ? "text-success" : "text-destructive"
                      }`}
                    >
                      {isCredit ? "+" : "-"}
                      {formatPriceExact(tx.amount)}
                    </p>
                    <span className="inline-flex items-center rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-foreground uppercase">
                      {tx.type.replace("_", " ")}
                    </span>
                    {tx.balanceAfter !== undefined && (
                      <p className="mt-1 text-xs font-medium text-muted-foreground">
                        Bal: {formatPriceExact(tx.balanceAfter)}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
