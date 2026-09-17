import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import {
  ShoppingBag,
  DollarSign,
  Wallet,
  BarChart3,
  CheckCircle2,
  XCircle,
  CreditCard,
} from "lucide-react"
import { formatPrice } from "@/lib/format"
import { KpiCard } from "./AnalyticsWidgets"
import type { AnalyticsData } from "@/types/admin"

interface DashboardOverviewTabProps {
  kpis: AnalyticsData["kpis"]
  chartData: AnalyticsData["chartData"]
  revenueByDow: AnalyticsData["revenueByDow"]
  paymentSplit: AnalyticsData["paymentSplit"]
  paymentPieData: Array<{ name: string; value: number }>
  PIE_COLORS: string[]
}

export function DashboardOverviewTab({
  kpis,
  chartData,
  revenueByDow,
  paymentSplit,
  paymentPieData,
  PIE_COLORS,
}: DashboardOverviewTabProps) {
  return (
    <div className="space-y-6">
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
              <span className="font-bold">{kpis.cancellationRate}%</span>
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
        <h3 className="mb-1 font-heading text-lg font-bold">Revenue Trend</h3>
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
                <linearGradient id="colorGmv" x1="0" y1="0" x2="0" y2="1">
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
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
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
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
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
          <p className="mb-5 text-xs text-muted-foreground">GMV per weekday</p>
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
              <p className="text-sm text-muted-foreground">No payment data</p>
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
              <span className="font-bold">{paymentSplit.monnify} orders</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Wallet className="size-3.5 text-chart-2" /> Wallet
              </span>
              <span className="font-bold">{paymentSplit.wallet} orders</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
