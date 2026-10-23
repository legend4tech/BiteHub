import { ArrowDownLeft, ArrowUpRight } from "lucide-react"
import { formatPriceExact } from "@/lib/format"
import { DownloadReceiptButton } from "@/components/customer/DownloadReceiptButton"
import type { Transaction } from "@/types/customer"

interface TransactionRowProps {
  tx: Transaction
  customerName: string
  isFirst?: boolean
}

/**
 * Single wallet transaction row, shared by the wallet page and the full
 * transaction history. Stacks on mobile so long references and amounts never
 * overflow, and goes inline from `sm` up.
 */
export function TransactionRow({
  tx,
  customerName,
  isFirst = false,
}: TransactionRowProps) {
  // Sign/colour must come from the stored direction, not the type: e.g. an
  // expired-coins entry is type "reward" but a debit.
  const isCredit = tx.direction === "credit"

  return (
    <div
      className={`flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6 ${
        isFirst ? "" : "border-t border-border"
      }`}
    >
      <div className="flex min-w-0 items-start gap-3 sm:items-center sm:gap-4">
        <div
          className={`shrink-0 rounded-lg p-3 ${
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
        <div className="min-w-0">
          <p className="text-base font-semibold break-words sm:text-lg">
            {tx.description}
          </p>
          <p className="text-sm text-muted-foreground">
            {new Date(tx.createdAt).toLocaleString()} • Ref:{" "}
            <span className="font-mono text-xs break-all">{tx.reference}</span>
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-4 sm:justify-end sm:gap-6 sm:text-right">
        <div>
          <p
            className={`text-lg font-bold ${
              isCredit ? "text-success" : "text-destructive"
            }`}
          >
            {isCredit ? "+" : "-"}
            {formatPriceExact(tx.amountInKobo)}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2 sm:justify-end">
            <span className="inline-flex items-center justify-center rounded-full bg-accent px-2.5 py-0.5 text-center text-xs font-semibold whitespace-nowrap text-foreground uppercase">
              {tx.type.replace("_", " ")}
            </span>
            {tx.balanceAfterInKobo !== undefined && (
              <span className="text-xs font-medium text-muted-foreground">
                Bal: {formatPriceExact(tx.balanceAfterInKobo)}
              </span>
            )}
          </div>
        </div>

        <DownloadReceiptButton transaction={tx} customerName={customerName} />
      </div>
    </div>
  )
}
