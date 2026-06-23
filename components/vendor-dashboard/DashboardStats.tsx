import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  Zap,
  Banknote,
  ArrowUpRight,
  Wallet,
} from "lucide-react"
import { formatPriceExact } from "@/lib/format"

interface DashboardStatsProps {
  totalOrders: number
  todayOrders: number
  pending: number
  inProgress: number
  totalCompleted: number
  monnifyDisbursed?: number
  monnifyPending?: number
}

export function DashboardStats(props: DashboardStatsProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Overview Stats Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
        {/* Total Orders (Highlight Card) */}
        <div className="group col-span-2 flex transform-gpu flex-col justify-between rounded-[2rem] border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background p-6 shadow-sm transition-all hover:shadow-md md:col-span-1">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ShoppingBag className="size-6" />
            </div>
            <ArrowUpRight className="size-5 text-primary/50 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
          </div>
          <div className="mt-8">
            <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
              Total Orders
            </p>
            <p className="mt-2 font-heading text-4xl font-bold tracking-tight text-foreground">
              {props.totalOrders}
            </p>
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              <ArrowUpRight className="size-3" />
              {props.todayOrders} new today
            </div>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="col-span-1 flex transform-gpu flex-col justify-between rounded-[2rem] border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
              <Clock className="size-5" />
            </div>
            {props.pending > 0 && (
              <span className="relative flex size-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-500 opacity-75"></span>
                <span className="relative inline-flex size-3 rounded-full bg-orange-500"></span>
              </span>
            )}
          </div>
          <div className="mt-6">
            <p className="text-xs font-medium text-muted-foreground">
              New Orders
            </p>
            <p className="mt-1 font-heading text-3xl font-bold text-foreground">
              {props.pending}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Ready to prep</p>
            <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
              Unpaid orders auto-cancel at midnight
            </p>
          </div>
        </div>

        {/* In Progress */}
        <div className="col-span-1 flex transform-gpu flex-col justify-between rounded-[2rem] border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
              <Zap className="size-5" />
            </div>
          </div>
          <div className="mt-6">
            <p className="text-xs font-medium text-muted-foreground">
              In Progress
            </p>
            <p className="mt-1 font-heading text-3xl font-bold text-foreground">
              {props.inProgress}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Preparing now</p>
          </div>
        </div>

        {/* Completed */}
        <div className="col-span-2 flex transform-gpu flex-col justify-between rounded-[2rem] border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md md:col-span-1">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="size-5" />
            </div>
          </div>
          <div className="mt-6">
            <p className="text-xs font-medium text-muted-foreground">
              Completed
            </p>
            <p className="mt-1 font-heading text-3xl font-bold text-foreground">
              {props.totalCompleted}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              All-time fulfilled
            </p>
          </div>
        </div>
      </div>

      {/* Financial Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
        <div className="flex items-center gap-5 rounded-[2rem] border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.25rem] bg-emerald-500/10 text-emerald-500">
            <Banknote className="size-8" />
          </div>
          <div>
            <p className="text-sm font-medium tracking-wide text-muted-foreground">
              Disbursed to Bank
            </p>
            <p className="mt-1 font-heading text-3xl font-bold text-foreground">
              {formatPriceExact(props.monnifyDisbursed || 0)}
            </p>
            <p className="mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              Successfully deposited
            </p>
          </div>
        </div>

        <div className="flex items-center gap-5 rounded-[2rem] border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.25rem] bg-amber-500/10 text-amber-500">
            <Wallet className="size-8" />
          </div>
          <div>
            <p className="text-sm font-medium tracking-wide text-muted-foreground">
              Pending Payout
            </p>
            <p className="mt-1 font-heading text-3xl font-bold text-foreground">
              {formatPriceExact(props.monnifyPending || 0)}
            </p>
            <p className="mt-1 text-xs font-medium text-amber-600 dark:text-amber-400">
              Arriving 10pm today
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
