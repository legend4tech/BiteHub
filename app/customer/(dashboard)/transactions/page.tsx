import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { formatPriceExact } from "@/lib/format"
import { ArrowDownLeft, ArrowUpRight, ArrowLeft } from "lucide-react"
import { EmptyState } from "@/components/shared/EmptyState"
import type { Transaction } from "@/types/customer"
import {
  getCustomerByEmail,
  getCustomerTransactionsList,
} from "@/lib/services/customerService"
import { DownloadReceiptButton } from "@/components/customer/DownloadReceiptButton"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const dynamic = "force-dynamic"

export default async function CustomerTransactionsPage(props: {
  searchParams?: Promise<{ page?: string; filter?: string }>
}) {
  const searchParams = await props.searchParams
  const session = await auth()
  if (!session?.user?.email) {
    return redirect("/customer/login")
  }

  const customer = await getCustomerByEmail(session.user.email)
  if (!customer) {
    return redirect("/customer/login")
  }

  const page = parseInt(searchParams?.page || "1", 10)
  const filter = searchParams?.filter || "all"

  const { transactions, totalPages, hasMore } =
    await getCustomerTransactionsList(
      customer._id.toString(),
      page,
      20, // limit
      filter
    )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/customer/wallet">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="font-heading text-2xl font-bold">
            Transaction History
          </h1>
          <p className="text-muted-foreground">
            View all your wallet activity and download receipts.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-border pb-4">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          asChild={filter !== "all"}
        >
          {filter === "all" ? (
            <span>All</span>
          ) : (
            <Link href="/customer/transactions?filter=all">All</Link>
          )}
        </Button>
        <Button
          variant={filter === "credit" ? "default" : "outline"}
          size="sm"
          asChild={filter !== "credit"}
        >
          {filter === "credit" ? (
            <span>Credits</span>
          ) : (
            <Link href="/customer/transactions?filter=credit">Credits</Link>
          )}
        </Button>
        <Button
          variant={filter === "debit" ? "default" : "outline"}
          size="sm"
          asChild={filter !== "debit"}
        >
          {filter === "debit" ? (
            <span>Debits</span>
          ) : (
            <Link href="/customer/transactions?filter=debit">Debits</Link>
          )}
        </Button>
      </div>

      {transactions.length === 0 ? (
        <EmptyState
          title="No transactions yet"
          description="Your wallet history will appear here once you make a deposit or purchase."
          className="rounded-xl border border-dashed border-border bg-card/50"
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {transactions.map((tx: Transaction, i: number) => {
            const isCredit = tx.type.includes("deposit") || tx.type === "reward"
            return (
              <div
                key={tx.id}
                className={`flex items-center justify-between p-4 sm:p-6 ${
                  i !== 0 ? "border-t border-border" : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`rounded-lg p-3 ${
                      isCredit
                        ? "bg-success/10 text-success"
                        : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {isCredit ? (
                      <ArrowDownLeft className="size-6" />
                    ) : (
                      <ArrowUpRight className="size-6" />
                    )}
                  </div>
                  <div>
                    <p className="text-lg font-semibold">{tx.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(tx.createdAt).toLocaleString()} • Ref:{" "}
                      <span className="font-mono text-xs">{tx.reference}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-right">
                  <div>
                    <p
                      className={`text-lg font-bold ${
                        isCredit ? "text-success" : "text-destructive"
                      }`}
                    >
                      {isCredit ? "+" : "-"}
                      {formatPriceExact(tx.amount)}
                    </p>
                    <div className="mt-1 flex items-center justify-end gap-2">
                      <span className="inline-flex items-center rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-foreground uppercase">
                        {tx.type.replace("_", " ")}
                      </span>
                      {tx.balanceAfter !== undefined && (
                        <span className="text-xs font-medium text-muted-foreground">
                          Bal: {formatPriceExact(tx.balanceAfter)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Download Receipt Button */}
                  <div className="hidden sm:block">
                    <DownloadReceiptButton
                      transaction={tx}
                      customerName={customer.name}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <Button variant="outline" disabled={page === 1} asChild={page > 1}>
            {page > 1 ? (
              <Link
                href={`/customer/transactions?page=${page - 1}&filter=${filter}`}
              >
                Previous
              </Link>
            ) : (
              <span>Previous</span>
            )}
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button variant="outline" disabled={!hasMore} asChild={hasMore}>
            {hasMore ? (
              <Link
                href={`/customer/transactions?page=${page + 1}&filter=${filter}`}
              >
                Next
              </Link>
            ) : (
              <span>Next</span>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
