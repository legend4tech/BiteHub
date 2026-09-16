import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown } from "lucide-react"
import { isValidElement, cloneElement } from "react"

export function exportToCSV(
  chartData: Array<{
    date: string
    orders: number
    gmv: number
    profit: number
  }>,
  rangeLabel: string
) {
  const headers = ["Date", "Orders", "Gross Volume (N)", "Platform Profit (N)"]
  const rows = chartData.map((row) => [
    row.date,
    row.orders,
    row.gmv.toFixed(2),
    row.profit.toFixed(2),
  ])
  const csvContent = [headers, ...rows].map((r) => r.join(",")).join("\n")
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.setAttribute("download", `bitehub-analytics-${rangeLabel}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function GrowthBadge({ value }: { value: number }) {
  const isPositive = value >= 0
  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
        isPositive
          ? "bg-status-completed/10 text-status-completed"
          : "bg-destructive/10 text-destructive"
      )}
    >
      {isPositive ? (
        <TrendingUp className="size-3" />
      ) : (
        <TrendingDown className="size-3" />
      )}
      {Math.abs(value)}%
    </div>
  )
}

export interface KpiCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  growth?: number
  accent?: boolean
  description?: string
}

export function KpiCard({
  icon,
  label,
  value,
  growth,
  accent,
  description,
}: KpiCardProps) {
  const bgIcon = isValidElement(icon)
    ? cloneElement(
        icon as React.ReactElement,
        {
          className: "size-28", // Large icon, placement handled by container
        } as React.HTMLAttributes<HTMLElement>
      )
    : null

  if (accent) {
    return (
      <div className="group relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/15 via-background to-background p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
        <div className="pointer-events-none absolute -top-6 -right-6 text-primary opacity-[0.08] transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-12">
          {bgIcon}
        </div>

        <div className="relative z-10 mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <span className="text-primary">{icon}</span> {label}
          </div>
          {growth !== undefined && (
            <div className="rounded-full bg-primary/10 px-2 py-0.5">
              <GrowthBadge value={growth} />
            </div>
          )}
        </div>
        <p className="relative z-10 font-heading text-3xl font-bold text-foreground">
          {value}
        </p>
        {description && (
          <p className="relative z-10 mt-1 text-xs text-muted-foreground">
            {description}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <div className="pointer-events-none absolute -top-6 -right-6 text-foreground opacity-[0.02] transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-12">
        {bgIcon}
      </div>

      <div className="relative z-10 mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          {icon} {label}
        </div>
        {growth !== undefined && <GrowthBadge value={growth} />}
      </div>
      <p className="relative z-10 font-heading text-3xl font-bold">{value}</p>
      {description && (
        <p className="relative z-10 mt-1 text-xs text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  )
}
