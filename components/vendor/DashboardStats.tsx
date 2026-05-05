import { ShoppingBag, Clock, CheckCircle2, Package } from "lucide-react";

interface DashboardStatsProps {
  total: number;
  pending: number;
  preparing: number;
  completed: number;
}

export function DashboardStats({ total, pending, preparing, completed }: DashboardStatsProps) {
  const stats = [
    { label: "Today's Orders", value: total, icon: ShoppingBag, color: "text-primary", bg: "bg-primary/10" },
    { label: "Pending", value: pending, icon: Clock, color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-100 dark:bg-yellow-900/20" },
    { label: "Preparing", value: preparing, icon: Package, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-900/20" },
    { label: "Completed", value: completed, icon: CheckCircle2, color: "text-green-600 dark:text-green-400", bg: "bg-green-100 dark:bg-green-900/20" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s) => (
        <div key={s.label} className="rounded-2xl bg-card border border-border p-5">
          <div className={`h-10 w-10 rounded-xl ${s.bg} grid place-items-center mb-3`}>
            <s.icon className={`size-5 ${s.color}`} />
          </div>
          <p className="text-2xl font-heading font-bold">{s.value}</p>
          <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
        </div>
      ))}
    </div>
  );
}
