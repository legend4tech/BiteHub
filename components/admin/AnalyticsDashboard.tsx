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
              {/* 5 KPI Cards */}
              <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
                <KpiCard
                  icon={<ShoppingBag className="size-4" />}
                  label="Total Orders"
                  value={kpis.totalOrders.toLocaleString()}
                  growth={kpis.growth.orders}
                />
                <KpiCard
                  icon={<DollarSign className="size-4" />}
                  label="Gross Volume"
                  value={formatPrice(kpis.totalGMV)}
                  growth={kpis.growth.gmv}
                />
                <KpiCard
                  icon={<Wallet className="size-4" />}
                  label="Platform Profit"
                  value={formatPrice(kpis.totalProfit)}
                  growth={kpis.growth.profit}
                  accent
                />
                <KpiCard
                  icon={<BarChart3 className="size-4" />}
                  label="Avg. Order Value"
                  value={formatPrice(kpis.aov)}
                  growth={kpis.growth.aov}
                />
                <div className="col-span-2 rounded-2xl border border-border bg-card p-5 shadow-sm xl:col-span-1">
                  <p className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <CheckCircle2 className="size-4" /> Order Health
                  </p>
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5 font-medium text-status-completed">
                        <CheckCircle2 className="size-3.5" /> Completion
                      </span>
                      <span className="font-bold">{kpis.completionRate}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted">
                      <div
                        className="h-1.5 rounded-full bg-status-completed transition-all duration-700"
                        style={{ width: `${kpis.completionRate}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5 font-medium text-destructive">
                        <XCircle className="size-3.5" /> Cancellation
                      </span>
                      <span className="font-bold">
                        {kpis.cancellationRate}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted">
                      <div
                        className="h-1.5 rounded-full bg-destructive transition-all duration-700"
                        style={{ width: `${kpis.cancellationRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Revenue Trend */}
              <div className="rounded-3xl border border-border bg-card/50 p-6 shadow-sm backdrop-blur-xl">
                <h3 className="mb-1 font-heading text-lg font-bold">
                  Revenue Trend
                </h3>
                <p className="mb-6 text-xs text-muted-foreground">
                  GMV &amp; platform profit over time
                </p>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={chartData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="colorGmv"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="var(--color-muted-foreground)"
                            stopOpacity={0.2}
                          />
                          <stop
                            offset="95%"
                            stopColor="var(--color-muted-foreground)"
                            stopOpacity={0}
                          />
                        </linearGradient>
                        <linearGradient
                          id="colorProfit"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="var(--color-primary)"
                            stopOpacity={0.4}
                          />
                          <stop
                            offset="95%"
                            stopColor="var(--color-primary)"
                            stopOpacity={0}
                          />
                        </linearGradient>
                        <filter id="glow">
                          <feGaussianBlur stdDeviation="3" result="blur" />
                          <feComposite
                            in="SourceGraphic"
                            in2="blur"
                            operator="over"
                          />
                        </filter>
                      </defs>
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fontSize: 11,
                          fill: "var(--color-muted-foreground)",
                        }}
                        dy={8}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fontSize: 11,
                          fill: "var(--color-muted-foreground)",
                        }}
                        tickFormatter={(v) => `N${(v / 1000).toFixed(0)}k`}
                      />
                      <CartesianGrid
                        vertical={false}
                        stroke="var(--color-border)"
                        strokeDasharray="4 4"
                      />
                      <RechartsTooltip
                        contentStyle={{
                          borderRadius: "12px",
                          border: "1px solid var(--color-border)",
                          backgroundColor: "var(--color-card)",
                          color: "var(--color-foreground)",
                        }}
                        formatter={(value: unknown, name: unknown) => [
                          formatPrice(Number(value) || 0),
                          name === "gmv" ? "GMV" : "Profit",
                        ]}
                      />
                      <Area
                        type="monotone"
                        dataKey="gmv"
                        name="gmv"
                        stroke="var(--color-muted-foreground)"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorGmv)"
                      />
                      <Area
                        type="monotone"
                        dataKey="profit"
                        name="profit"
                        stroke="var(--color-primary)"
                        strokeWidth={3}
                        filter="url(#glow)"
                        fillOpacity={1}
                        fill="url(#colorProfit)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Day-of-Week + Payment Split */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
                <div className="rounded-3xl border border-border bg-card p-6 shadow-sm lg:col-span-3">
                  <h3 className="mb-1 font-heading text-base font-bold">
                    Revenue by Day of Week
                  </h3>
                  <p className="mb-5 text-xs text-muted-foreground">
                    GMV per weekday
                  </p>
                  <div className="h-[240px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={revenueByDow}
                        margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                      >
                        <XAxis
                          dataKey="day"
                          axisLine={false}
                          tickLine={false}
                          tick={{
                            fontSize: 11,
                            fill: "var(--color-muted-foreground)",
                          }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{
                            fontSize: 11,
                            fill: "var(--color-muted-foreground)",
                          }}
                          tickFormatter={(v) => `N${(v / 1000).toFixed(0)}k`}
                        />
                        <CartesianGrid
                          vertical={false}
                          stroke="var(--color-border)"
                          strokeDasharray="4 4"
                        />
                        <RechartsTooltip
                          contentStyle={{
                            borderRadius: "12px",
                            border: "1px solid var(--color-border)",
                            backgroundColor: "var(--color-card)",
                            color: "var(--color-foreground)",
                          }}
                          formatter={(value: unknown) => [
                            formatPrice(Number(value) || 0),
                            "GMV",
                          ]}
                          cursor={{ fill: "var(--color-muted)", opacity: 0.3 }}
                        />
                        <Bar
                          dataKey="gmv"
                          fill="var(--color-primary)"
                          radius={[6, 6, 0, 0]}
                          barSize={28}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="flex flex-col rounded-3xl border border-border bg-card p-6 shadow-sm lg:col-span-2">
                  <h3 className="mb-1 font-heading text-base font-bold">
                    Payment Methods
                  </h3>
                  <p className="mb-4 text-xs text-muted-foreground">
                    Monnify vs Wallet
                  </p>
                  <div className="flex flex-1 items-center justify-center">
                    {paymentSplit.monnify === 0 && paymentSplit.wallet === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No payment data
                      </p>
                    ) : (
                      <div className="h-[180px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={paymentPieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={72}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              {paymentPieData.map((_, index) => (
                                <Cell
                                  key={index}
                                  fill={PIE_COLORS[index % PIE_COLORS.length]}
                                />
                              ))}
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
                  <div className="mt-3 space-y-2 border-t border-border pt-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <CreditCard className="size-3.5 text-primary" /> Monnify
                      </span>
                      <span className="font-bold">
                        {paymentSplit.monnify} orders
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Wallet className="size-3.5 text-chart-2" /> Wallet
                      </span>
                      <span className="font-bold">
                        {paymentSplit.wallet} orders
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ── Vendors Tab ── */}
            <TabsContent value="vendors" className="space-y-6">
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <KpiCard
                  icon={<Store className="size-4" />}
                  label="Total Vendors"
                  value={overview.totalVendors.toLocaleString()}
                />
                <KpiCard
                  icon={<Store className="size-4 text-status-completed" />}
                  label="Active Vendors"
                  value={overview.activeVendors.toLocaleString()}
                  description={`${Math.round((overview.activeVendors / Math.max(overview.totalVendors, 1)) * 100)}% of all vendors`}
                />
                <KpiCard
                  icon={<TrendingUp className="size-4" />}
                  label="New This Period"
                  value={overview.newVendors.toLocaleString()}
                  accent
                />
                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <p className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Store className="size-4" /> Activity Rate
                  </p>
                  <p className="font-heading text-3xl font-bold">
                    {overview.totalVendors > 0
                      ? Math.round(
                          (overview.activeVendors / overview.totalVendors) * 100
                        )
                      : 0}
                    %
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Vendors currently active
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                <h3 className="mb-1 font-heading text-base font-bold">
                  Top 5 Vendors by GMV
                </h3>
                <p className="mb-6 text-xs text-muted-foreground">
                  GMV vs vendor revenue
                </p>
                {topVendors.length === 0 ? (
                  <div className="flex h-[260px] flex-col items-center justify-center text-muted-foreground">
                    <Store className="mb-3 size-12 opacity-30" />
                    <p className="text-sm">No vendor data for this period</p>
                  </div>
                ) : (
                  <div className="h-[260px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={topVendors}
                        layout="vertical"
                        margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
                      >
                        <XAxis
                          type="number"
                          axisLine={false}
                          tickLine={false}
                          tick={{
                            fontSize: 11,
                            fill: "var(--color-muted-foreground)",
                          }}
                          tickFormatter={(v) => `N${(v / 1000).toFixed(0)}k`}
                        />
                        <YAxis
                          dataKey="name"
                          type="category"
                          width={110}
                          axisLine={false}
                          tickLine={false}
                          tick={{
                            fontSize: 11,
                            fill: "var(--color-muted-foreground)",
                          }}
                        />
                        <CartesianGrid
                          horizontal={false}
                          stroke="var(--color-border)"
                          strokeDasharray="4 4"
                        />
                        <RechartsTooltip
                          contentStyle={{
                            borderRadius: "12px",
                            border: "1px solid var(--color-border)",
                            backgroundColor: "var(--color-card)",
                            color: "var(--color-foreground)",
                          }}
                          formatter={(value: unknown, name: unknown) => [
                            formatPrice(Number(value) || 0),
                            name === "gmv" ? "GMV" : "Vendor Revenue",
                          ]}
                          cursor={{ fill: "var(--color-muted)", opacity: 0.3 }}
                        />
                        <Bar
                          dataKey="gmv"
                          name="gmv"
                          fill="var(--color-primary)"
                          radius={[0, 4, 4, 0]}
                          barSize={12}
                        />
                        <Bar
                          dataKey="vendorRevenue"
                          name="vendorRevenue"
                          fill="var(--color-chart-2)"
                          radius={[0, 4, 4, 0]}
                          barSize={12}
                        />
                        <Legend iconType="circle" iconSize={8} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {topVendors.length > 0 && (
                <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
                  <div className="border-b border-border px-6 py-4">
                    <h3 className="font-heading text-base font-bold">
                      Vendor Leaderboard
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                            #
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                            Vendor
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground">
                            Orders
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground">
                            GMV
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground">
                            Revenue
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {topVendors.map((vendor, i) => (
                          <tr
                            key={vendor.id}
                            className="border-b border-border/50 transition-colors hover:bg-muted/20"
                          >
                            <td className="px-6 py-3.5">
                              <span
                                className={cn(
                                  "inline-flex size-6 items-center justify-center rounded-full text-xs font-bold",
                                  i === 0
                                    ? "bg-primary/20 text-primary"
                                    : i === 1
                                      ? "bg-muted text-muted-foreground"
                                      : i === 2
                                        ? "bg-primary/10 text-primary"
                                        : "bg-muted text-muted-foreground"
                                )}
                              >
                                {i + 1}
                              </span>
                            </td>
                            <td className="px-6 py-3.5 font-medium">
                              {vendor.name}
                            </td>
                            <td className="px-6 py-3.5 text-right">
                              {vendor.ordersCount}
                            </td>
                            <td className="px-6 py-3.5 text-right font-medium">
                              {formatPrice(vendor.gmv)}
                            </td>
                            <td className="px-6 py-3.5 text-right font-medium text-status-completed">
                              {formatPrice(vendor.vendorRevenue)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
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
