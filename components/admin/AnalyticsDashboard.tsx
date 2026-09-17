"use client"

import { useState, useCallback, isValidElement, cloneElement } from "react"
import { useAdminAnalytics } from "@/hooks/admin/useAdminAnalytics"
import { PageSkeleton } from "@/components/shared/PageSkeleton"
import { FetchError } from "@/components/shared/FetchError"
import { formatPrice } from "@/lib/format"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import {
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  DollarSign,
  Wallet,
  Users,
  Store,
  Download,
  CalendarDays,
  CheckCircle2,
  XCircle,
  MapPin,
  CreditCard,
  BarChart3,
  RefreshCw,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { DateRange } from "react-day-picker"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { exportToCSV, GrowthBadge, KpiCard } from "./AnalyticsWidgets"
import { DashboardVendorsTab } from "./DashboardVendorsTab"
import { DashboardOverviewTab } from "./DashboardOverviewTab"

// ── CSV Export ──────────────────────────────────────────────────────────────
// ── AnalyticsDashboard ──────────────────────────────────────────────────────
export function AnalyticsDashboard() {
  const [range, setRange] = useState("30d")
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [calendarOpen, setCalendarOpen] = useState(false)

  const fromStr = dateRange?.from
    ? format(dateRange.from, "yyyy-MM-dd")
    : undefined
  const toStr = dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined

  const { data, isLoading, isError, refetch } = useAdminAnalytics(
    range,
    fromStr,
    toStr
  )

  const handlePreset = useCallback((preset: string) => {
    setRange(preset)
    setDateRange(undefined)
    setCalendarOpen(false)
  }, [])

  const handleDateSelect = useCallback((selected: DateRange | undefined) => {
    setDateRange(selected)
    if (selected?.from && selected?.to) {
      setRange("custom")
      setCalendarOpen(false)
    }
  }, [])

  const rangeLabel =
    range === "custom" && fromStr && toStr ? `${fromStr}_to_${toStr}` : range

  const displayRange =
    range === "custom" && dateRange?.from && dateRange?.to
      ? `${format(dateRange.from, "MMM d")} - ${format(dateRange.to, "MMM d, yyyy")}`
      : range === "7d"
        ? "Last 7 Days"
        : range === "30d"
          ? "Last 30 Days"
          : range === "1y"
            ? "This Year"
            : "All Time"

  if (isError) {
    return (
      <FetchError title="Failed to load analytics" onRetry={() => refetch()} />
    )
  }

  const kpis = data?.kpis
  const chartData = data?.chartData || []
  const revenueByDow = data?.revenueByDow || []
  const paymentSplit = data?.paymentSplit || { monnify: 0, wallet: 0 }
  const overview = data?.overview
  const topVendors = data?.topVendors || []
  const topZones = data?.topZones || []

  const paymentPieData = paymentSplit
    ? [
        { name: "Monnify", value: paymentSplit.monnify },
        { name: "Wallet", value: paymentSplit.wallet },
      ]
    : []
  const PIE_COLORS = ["var(--color-primary)", "var(--color-chart-2)"]

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">
            Analytics &amp; Growth
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Platform performance KPIs &middot;{" "}
            <span className="font-medium text-foreground">{displayRange}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(["7d", "30d", "1y", "all"] as const).map((preset) => (
            <Button
              key={preset}
              variant={range === preset ? "default" : "outline"}
              size="sm"
              onClick={() => handlePreset(preset)}
              className="h-9 text-xs font-semibold"
            >
              {preset === "7d"
                ? "7D"
                : preset === "30d"
                  ? "30D"
                  : preset === "1y"
                    ? "1Y"
                    : "All"}
            </Button>
          ))}

          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant={range === "custom" ? "default" : "outline"}
                size="sm"
                className="h-9 gap-2 text-xs font-semibold"
              >
                <CalendarDays className="size-3.5" />
                {range === "custom" && dateRange?.from && dateRange?.to
                  ? `${format(dateRange.from, "MMM d")} - ${format(dateRange.to, "MMM d")}`
                  : "Custom"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={handleDateSelect}
                numberOfMonths={2}
                toDate={new Date()}
              />
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0"
            onClick={() => refetch()}
            title="Refresh"
          >
            <RefreshCw className="size-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-2 text-xs font-semibold"
            onClick={() => exportToCSV(chartData, rangeLabel)}
          >
            <Download className="size-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="size-3.5" /> Overview
          </TabsTrigger>
          <TabsTrigger value="vendors" className="gap-2">
            <Store className="size-3.5" /> Vendors
          </TabsTrigger>
          <TabsTrigger value="customers" className="gap-2">
            <Users className="size-3.5" /> Customers
          </TabsTrigger>
        </TabsList>

        {isLoading || !data || !kpis || !overview ? (
          <PageSkeleton variant="admin-analytics-dashboard" />
        ) : (
          <>
            {/* ── Overview Tab ── */}
            <TabsContent value="overview" className="space-y-6">
              <DashboardOverviewTab
                kpis={kpis}
                chartData={chartData}
                revenueByDow={revenueByDow}
                paymentSplit={paymentSplit}
                paymentPieData={paymentPieData}
                PIE_COLORS={PIE_COLORS}
              />
            </TabsContent>

            <TabsContent value="vendors" className="space-y-6">
              <DashboardVendorsTab
                overview={overview}
                topVendors={topVendors}
              />
            </TabsContent>

            {/* ── Customers Tab ── */}
            <TabsContent value="customers" className="space-y-6">
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <KpiCard
                  icon={<Users className="size-4" />}
                  label="Total Customers"
                  value={overview.totalCustomers.toLocaleString()}
                />
                <KpiCard
                  icon={<TrendingUp className="size-4" />}
                  label="New This Period"
                  value={overview.newCustomers.toLocaleString()}
                  accent
                />
                <KpiCard
                  icon={<CheckCircle2 className="size-4" />}
                  label="Linked Orders"
                  value={overview.repeatOrders.toLocaleString()}
                  description="Orders with accounts"
                />
                <KpiCard
                  icon={<Users className="size-4" />}
                  label="Guest Orders"
                  value={overview.guestOrders.toLocaleString()}
                  description="Orders without accounts"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
                <div className="flex flex-col rounded-3xl border border-border bg-card p-6 shadow-sm lg:col-span-2">
                  <h3 className="mb-1 font-heading text-base font-bold">
                    Order Origin
                  </h3>
                  <p className="mb-4 text-xs text-muted-foreground">
                    Guest vs registered split
                  </p>
                  <div className="flex flex-1 items-center justify-center">
                    {overview.repeatOrders === 0 &&
                    overview.guestOrders === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No order data
                      </p>
                    ) : (
                      <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                {
                                  name: "Registered",
                                  value: overview.repeatOrders,
                                },
                                { name: "Guest", value: overview.guestOrders },
                              ]}
                              cx="50%"
                              cy="50%"
                              innerRadius={55}
                              outerRadius={78}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              <Cell fill="var(--color-primary)" />
                              <Cell fill="var(--color-chart-3)" />
                            </Pie>
                            <RechartsTooltip
                              contentStyle={{
                                borderRadius: "12px",
                                border: "1px solid var(--color-border)",
                                backgroundColor: "var(--color-card)",
                                color: "var(--color-foreground)",
                              }}
                              formatter={(value: unknown, name: unknown) => [
                                `${value} orders`,
                                String(name),
                              ]}
                            />
                            <Legend iconType="circle" iconSize={8} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-3xl border border-border bg-card p-6 shadow-sm lg:col-span-3">
                  <h3 className="mb-1 font-heading text-base font-bold">
                    Top Delivery Zones
                  </h3>
                  <p className="mb-5 text-xs text-muted-foreground">
                    Most active locations by order volume
                  </p>
                  {topZones.length === 0 ? (
                    <div className="flex h-[200px] flex-col items-center justify-center text-muted-foreground">
                      <MapPin className="mb-3 size-10 opacity-30" />
                      <p className="text-sm">
                        No location data for this period
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {topZones.map((zone, i) => {
                        const maxOrders = topZones[0]?.orders ?? 1
                        const pct = Math.round((zone.orders / maxOrders) * 100)
                        return (
                          <div key={i} className="space-y-1.5">
                            <div className="flex items-center justify-between text-sm">
                              <span className="flex items-center gap-1.5 font-medium">
                                <MapPin className="size-3.5 shrink-0 text-primary" />
                                {zone.zone || "Unknown"}
                              </span>
                              <span className="ml-2 shrink-0 text-xs font-bold">
                                {zone.orders} orders
                              </span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-muted">
                              <div
                                className="h-1.5 rounded-full bg-primary transition-all duration-700"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  )
}
