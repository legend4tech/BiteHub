import {
  ResponsiveContainer,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Bar,
  Legend,
} from "recharts"
import { Store, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatPrice } from "@/lib/format"
import { KpiCard } from "./AnalyticsWidgets"
import type { AnalyticsData } from "@/types/admin"

interface DashboardVendorsTabProps {
  overview: AnalyticsData["overview"]
  topVendors: AnalyticsData["topVendors"]
}

export function DashboardVendorsTab({
  overview,
  topVendors,
}: DashboardVendorsTabProps) {
  return (
    <div className="space-y-6">
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
                    <td className="px-6 py-3.5 font-medium">{vendor.name}</td>
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
    </div>
  )
}
