export const dynamic = "force-dynamic"
import { auth } from "@/auth"
import Link from "next/link"
import { EmptyState } from "@/components/shared/EmptyState"
import { TransactionRow } from "@/components/customer/TransactionRow"
import { WalletFundingSection } from "@/components/customer/WalletFundingSection"
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

      <WalletFundingSection
        walletBalance={walletBalance}
        depositBalance={depositBalance}
        promoBalance={promoBalance}
        hasWallet={!!wallet}
        isActive={isActive}
        wallet={
          wallet
            ? {
                bankName: wallet.bankName,
                accountNumber: wallet.accountNumber,
                accountName: wallet.accountName,
              }
            : null
        }
      />

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
