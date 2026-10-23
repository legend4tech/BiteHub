import { Suspense } from "react"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PageSkeleton } from "@/components/shared/PageSkeleton"
import { TransactionsList } from "@/components/customer/TransactionsList"

export const dynamic = "force-dynamic"

export default async function CustomerTransactionsPage(props: {
  searchParams?: Promise<{ page?: string; filter?: string }>
}) {
  const searchParams = await props.searchParams
  const session = await auth()
  if (!session?.user?.email) {
    return redirect("/customer/login")
  }

  const page = parseInt(searchParams?.page || "1", 10)
  const filter = searchParams?.filter || "all"

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
        <Button
          variant={filter === "rewards" ? "default" : "outline"}
          size="sm"
          asChild={filter !== "rewards"}
        >
          {filter === "rewards" ? (
            <span>Rewards</span>
          ) : (
            <Link href="/customer/transactions?filter=rewards">Rewards</Link>
          )}
        </Button>
      </div>

      {/* Keyed so every tab/page change re-suspends and only the list skeletons */}
      <Suspense
        key={`${filter}-${page}`}
        fallback={<PageSkeleton variant="transaction-list" count={6} />}
      >
        <TransactionsList
          customerEmail={session.user.email}
          page={page}
          filter={filter}
        />
      </Suspense>
    </div>
  )
}
