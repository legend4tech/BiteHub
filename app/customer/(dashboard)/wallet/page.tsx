import { auth } from "@/auth"
import { redirect } from "next/navigation"
import dbConnect from "@/lib/db"
import Customer from "@/models/Customer"
import Wallet from "@/models/Wallet"
import WalletTransaction from "@/models/WalletTransaction"
import { formatPrice } from "@/lib/format"
import {
  Wallet as WalletIcon,
  ArrowDownLeft,
  ArrowUpRight,
  Copy,
  Landmark,
  Banknote,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { activateWallet } from "@/lib/actions/wallet"
import type { Transaction } from "@/types/customer"

export default async function CustomerWalletPage() {
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

  let transactions: Transaction[] = []
  if (wallet) {
    transactions = await WalletTransaction.find({ customerId: customer._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean()
  }

  const walletBalance = wallet ? wallet.balance : 0
  const isActive = !!wallet?.accountNumber

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">My Wallet</h1>
        <p className="text-muted-foreground">
          Manage your funds and deposit money for seamless checkout.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Balance & Actions */}
        <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm">
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
              {formatPrice(walletBalance)}
            </h2>
          </div>

          <div className="mt-8 border-t border-border pt-6">
            {!isActive ? (
              <form action={activateWallet}>
                <Button type="submit" variant="hero" className="w-full">
                  Activate Naira Wallet
                </Button>
              </form>
            ) : (
              <div className="flex flex-col gap-3">
                <Button variant="hero" className="w-full justify-start pl-4">
                  <Landmark className="mr-3 size-4" /> Fund via Bank Transfer
                </Button>
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
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 font-heading text-lg font-bold">
            <Landmark className="size-5 text-primary" /> Virtual Bank Account
          </h3>

          {!isActive ? (
            <div className="flex h-40 flex-col items-center justify-center space-y-3 text-center">
              <div className="rounded-full border border-border bg-background p-3">
                <Landmark className="size-6 text-muted-foreground" />
              </div>
              <p className="max-w-[250px] text-sm font-medium text-muted-foreground">
                Activate your wallet to get a dedicated Monnify account number
                for automatic funding.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Transfer Naira to this account to instantly fund your wallet.
              </p>
              <div className="space-y-3">
                <div className="rounded-xl border border-border bg-background p-4">
                  <p className="mb-1 text-xs font-semibold text-muted-foreground uppercase">
                    Bank Name
                  </p>
                  <p className="font-bold">{wallet!.bankName}</p>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border bg-background p-4">
                  <div>
                    <p className="mb-1 text-xs font-semibold text-muted-foreground uppercase">
                      Account Number
                    </p>
                    <p className="font-mono text-lg font-bold tracking-wider text-primary">
                      {wallet!.accountNumber}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                  >
                    <Copy className="size-4" />
                  </Button>
                </div>
                <div className="rounded-xl border border-border bg-background p-4">
                  <p className="mb-1 text-xs font-semibold text-muted-foreground uppercase">
                    Account Name
                  </p>
                  <p className="font-bold">{wallet!.accountName}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transaction History */}
      <div className="space-y-4">
        <h2 className="font-heading text-lg font-bold">Recent Transactions</h2>

        {transactions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
              <Banknote className="size-6 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              No transactions yet
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            {transactions.map((tx: Transaction, i: number) => {
              const isCredit =
                tx.type.includes("deposit") || tx.type === "reward"
              return (
                <div
                  key={tx._id.toString()}
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
                        isCredit ? "text-success" : "text-foreground"
                      }`}
                    >
                      {isCredit ? "+" : "-"}
                      {formatPrice(tx.amount)}
                    </p>
                    <span className="inline-flex items-center rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-foreground uppercase">
                      {tx.type.replace("_", " ")}
                    </span>
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
