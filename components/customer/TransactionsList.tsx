import { redirect } from "next/navigation"
import { EmptyState } from "@/components/shared/EmptyState"
import { DataPagination } from "@/components/shared/DataPagination"
import { TransactionRow } from "@/components/customer/TransactionRow"
import {
  getCustomerByEmail,
  getCustomerTransactionsList,
} from "@/lib/services/customerService"
import type { Transaction } from "@/types/customer"

interface TransactionsListProps {
  customerEmail: string
  page: number
  filter: string
}

/**
 * Async server component that owns the transactions DB fetch. It is rendered
 * inside a keyed <Suspense> so filter/page changes only skeleton this list.
 */
export async function TransactionsList({
  customerEmail,
  page,
  filter,
}: TransactionsListProps) {
  const customer = await getCustomerByEmail(customerEmail)
  if (!customer) {
    return redirect("/customer/login")
  }

  const { transactions, totalPages } = await getCustomerTransactionsList(
    customer._id.toString(),
    page,
    20, // limit
    filter
  )

  return (
    <>
      {transactions.length === 0 ? (
        <EmptyState
          title="No transactions yet"
          description="Your wallet history will appear here once you make a deposit or purchase."
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

      <DataPagination
        currentPage={page}
        totalPages={totalPages}
        baseUrl={`/customer/transactions?filter=${filter}`}
        className="pt-4"
      />
    </>
  )
}
