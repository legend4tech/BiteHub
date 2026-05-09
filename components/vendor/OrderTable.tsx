import type { Order } from "@/lib/types";
import { ORDER_STATUS_CONFIG } from "@/lib/constants";
import type { OrderStatus } from "@/lib/types";
import { StatusBadge } from "@/components/vendor/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatPrice } from "@/lib/format";

interface OrderTableProps {
  orders: Order[];
  onStatusChange?: (orderId: string, status: OrderStatus) => void;
}

const ALL_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "completed",
  "cancelled",
];

export function OrderTable({ orders, onStatusChange }: OrderTableProps) {
  if (orders.length === 0) {
    return (
      <EmptyState
        size="sm"
        icon="📋"
        showImage={false}
        title="No orders yet"
        description="Orders placed by students will appear here as they come in."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground">Order ID</th>
            <th className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground">Customer</th>
            <th className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground">Items</th>
            <th className="text-right py-3 px-3 text-xs font-semibold text-muted-foreground">Total</th>
            <th className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground">Status</th>
            <th className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground">Time</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {orders.map((order) => (
            <tr key={order.orderId} className="hover:bg-muted/30 transition-colors">
              <td className="py-3 px-3">
                <span className="font-mono text-xs font-semibold text-primary">{order.orderId}</span>
              </td>
              <td className="py-3 px-3">
                <p className="font-medium">{order.customerName}</p>
                <p className="text-xs text-muted-foreground">{order.customerPhone}</p>
              </td>
              <td className="py-3 px-3">
                <p className="text-xs text-muted-foreground">
                  {order.items.map((i) => `${i.name} ×${i.quantity}`).join(", ")}
                </p>
              </td>
              <td className="py-3 px-3 text-right font-bold">
                {formatPrice(order.total)}
              </td>
              <td className="py-3 px-3">
                {onStatusChange ? (
                  <select
                    value={order.status}
                    onChange={(e) => onStatusChange(order.orderId, e.target.value as OrderStatus)}
                    className="rounded-lg border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:border-primary"
                  >
                    {ALL_STATUSES.map((s) => (
                      <option key={s} value={s}>{ORDER_STATUS_CONFIG[s].label}</option>
                    ))}
                  </select>
                ) : (
                  <StatusBadge status={order.status} />
                )}
              </td>
              <td className="py-3 px-3 text-xs text-muted-foreground whitespace-nowrap">
                {new Date(order.createdAt).toLocaleDateString("en-NG", {
                  month: "short",
                  day: "numeric",
                })}
                {" "}
                {new Date(order.createdAt).toLocaleTimeString("en-NG", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
