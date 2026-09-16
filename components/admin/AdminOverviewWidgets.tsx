import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

export function StatCard({
  label,
  value,
  icon: Icon,
  accent = false,
  sub,
}: {
  label: string
  value: string | number
  icon: React.ElementType
  accent?: boolean
  sub?: string
}) {
  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border p-5 ${accent ? "border-primary/20 bg-primary/5" : "border-border bg-card"}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          {label}
        </p>
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${accent ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
        >
          <Icon className="size-4" />
        </div>
      </div>
      <div className="min-w-0">
        <p
          title={String(value)}
          className={`truncate font-heading text-2xl font-bold ${accent ? "text-primary" : ""}`}
        >
          {value}
        </p>
        {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  )
}

export function WithdrawalModal({
  show,
  onClose,
  withdrawAmount,
  setWithdrawAmount,
  withdrawRef,
  setWithdrawRef,
  withdrawNote,
  setWithdrawNote,
  submitting,
  onSubmit,
}: {
  show: boolean
  onClose: () => void
  withdrawAmount: string
  setWithdrawAmount: (val: string) => void
  withdrawRef: string
  setWithdrawRef: (val: string) => void
  withdrawNote: string
  setWithdrawNote: (val: string) => void
  submitting: boolean
  onSubmit: () => void
}) {
  if (!show) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-heading text-lg font-bold">Log a Withdrawal</h3>
          <button onClick={onClose} className="rounded-xl p-1.5 hover:bg-muted">
            <X className="size-4" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Amount (₦)
            </label>
            <input
              type="number"
              placeholder="e.g. 5000"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Bank Transfer Reference
            </label>
            <input
              type="text"
              placeholder="e.g. TRF/2024/09/001"
              value={withdrawRef}
              onChange={(e) => setWithdrawRef(e.target.value)}
              className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Note (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. September salary"
              value={withdrawNote}
              onChange={(e) => setWithdrawNote(e.target.value)}
              className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>
          <Button className="w-full" onClick={onSubmit} disabled={submitting}>
            {submitting ? "Saving..." : "Log Withdrawal"}
          </Button>
        </div>
      </div>
    </div>
  )
}
