import { ShoppingBag, Clock, CheckCircle2, Zap, TrendingUp } from "lucide-react"
import { formatPrice } from "@/lib/format"

interface DashboardStatsProps {
  totalOrders: number
  todayOrders: number
  pending: number
  inProgress: number
  totalCompleted: number
  totalRevenue: number
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
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-900/20",
      alert: props.pending > 0,
    },
    {
      label: "In Progress",
      value: props.inProgress,
      sub: "confirmed / preparing / ready",
      icon: Zap,
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-50 dark:bg-orange-900/20",
    },
    {
      label: "Completed",
      value: props.totalCompleted,
      sub: "all-time fulfilled",
      icon: CheckCircle2,
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-50 dark:bg-green-900/20",
    },
    {
      label: "Total Earnings",
      value: formatPrice(props.totalRevenue),
      sub: "all-time revenue",
      icon: TrendingUp,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-900/20",
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-5">
      {statCards.map((s) => (
        <div
          key={s.label}
          className={`flex flex-col gap-3 rounded-2xl border p-4 transition-all hover:shadow-sm md:p-5 ${
            s.accent
              ? "border-primary/20 bg-primary/5"
              : s.alert
                ? "border-amber-300 bg-amber-50/50 dark:border-amber-700/40 dark:bg-amber-900/10"
                : "border-border bg-card"
          }`}
        >
          <div className="flex items-center justify-between">
            <div
              className={`h-9 w-9 rounded-xl ${s.bg} grid shrink-0 place-items-center`}
            >
              <s.icon className={`size-4 ${s.color}`} />
            </div>
            {s.accent && (
              <TrendingUp className="size-3.5 text-primary opacity-60" />
            )}
            {s.alert && (
              <span className="size-2 animate-pulse rounded-full bg-amber-500" />
            )}
          </div>
          <div>
            <p
              className={`font-heading text-2xl font-bold md:text-3xl ${s.accent ? "text-primary" : s.alert ? "text-amber-700 dark:text-amber-400" : ""}`}
            >
              {s.value}
            </p>
            <p className="mt-0.5 text-xs font-medium text-muted-foreground">
              {s.label}
            </p>
            <p className="mt-0.5 hidden text-[10px] text-muted-foreground/70 sm:block">
              {s.sub}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
