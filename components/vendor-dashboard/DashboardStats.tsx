import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  Zap,
  TrendingUp,
  Banknote,
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
  const statCards = [
    {
      label: "All Orders",
      value: props.totalOrders,
      sub: `${props.todayOrders} placed today`,
      icon: ShoppingBag,
      color: "text-primary",
      bg: "bg-primary/10",
      accent: true,
    },
    {
      label: "Pending",
      value: props.pending,
      sub: "awaiting your action",
      icon: Clock,
      color: "text-status-pending",
      bg: "bg-status-pending/10",
      alert: props.pending > 0,
    },
    {
      label: "In Progress",
      value: props.inProgress,
      sub: "confirmed / preparing / ready",
      icon: Zap,
      color: "text-status-preparing",
      bg: "bg-status-preparing/10",
    },
    {
      label: "Completed",
      value: props.totalCompleted,
      sub: "all-time fulfilled",
      icon: CheckCircle2,
      color: "text-status-completed",
      bg: "bg-status-completed/10",
    },
    {
      label: "Disbursed to Bank",
      value: formatPriceExact(props.monnifyDisbursed || 0),
      sub: "successfully deposited",
      icon: Banknote,
      color: "text-status-completed",
      bg: "bg-status-completed/10",
    },
    {
      label: "Pending Payout",
      value: formatPriceExact(props.monnifyPending || 0),
      sub: "arriving 10pm same day",
      icon: TrendingUp,
      color: "text-status-confirmed",
      bg: "bg-status-confirmed/10",
    },
  ]

  const orderCards = statCards.slice(0, 4)
  const financialCards = statCards.slice(4, 6)

  const renderCard = (s: (typeof statCards)[0]) => (
    <div
      key={s.label}
      className={`group relative flex flex-col gap-4 overflow-hidden rounded-3xl border p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5 ${
        s.accent
          ? "border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-background"
          : s.alert
            ? "border-status-pending/50 bg-gradient-to-br from-status-pending/10 via-status-pending/5 to-background dark:border-status-pending/40"
            : "border-border/50 bg-gradient-to-br from-card via-card/80 to-muted/20"
      }`}
    >
      <div className="flex items-start justify-between">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${s.bg} transition-transform duration-300 group-hover:scale-110 group-hover:shadow-sm`}
        >
          <s.icon className={`size-5 ${s.color}`} />
        </div>
        {s.accent && <TrendingUp className="size-4 text-primary opacity-50" />}
        {s.alert && (
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-pending opacity-75"></span>
            <span className="relative inline-flex size-2.5 rounded-full bg-status-pending"></span>
          </span>
        )}
      </div>
      <div className="mt-1">
        <p className="text-xs font-semibold tracking-wider text-muted-foreground/80 uppercase">
          {s.label}
        </p>
        <p
          className={`mt-1.5 font-heading text-2xl font-bold tracking-tight md:text-3xl ${s.accent ? "text-primary" : s.alert ? "text-status-pending-foreground" : ""}`}
        >
          {s.value}
        </p>
        <p className="mt-1.5 hidden text-[11px] font-medium text-muted-foreground/60 sm:block">
          {s.sub}
        </p>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col gap-4 md:gap-5">
      {/* Order Operations Grid (4 columns) */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
        {orderCards.map(renderCard)}
      </div>

      {/* Financials Grid (2 columns) */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-5">
        {financialCards.map(renderCard)}
      </div>
    </div>
  )
}
