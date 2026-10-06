"use client"
import { useState, useOptimistic, useTransition } from "react"
import { Switch } from "@/components/ui/switch"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useVendorUpdateSettings } from "@/hooks/vendor/useVendorMutations"
interface StoreStatusToggleProps {
  isOpen: boolean
  onToggle: (isOpen: boolean) => void
  disabled?: boolean
}
export function StoreStatusToggle({
  isOpen,
  onToggle,
  disabled,
}: StoreStatusToggleProps) {
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<boolean | null>(null)
  const [isToggling, setIsToggling] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [optimisticIsOpen, addOptimisticIsOpen] = useOptimistic<
    boolean,
    boolean
  >(isOpen, (state, newIsOpen) => newIsOpen)
  const updateSettingsMutation = useVendorUpdateSettings()
  const router = useRouter()
  const confirmStatusChange = () => {
    if (pendingStatus === null) return
    setIsToggling(true)
    setShowStatusModal(false)
    startTransition(async () => {
      addOptimisticIsOpen(pendingStatus)
      try {
        await updateSettingsMutation.mutateAsync({ isOpen: pendingStatus })
        onToggle(pendingStatus)
        toast.success(
          pendingStatus
            ? "Store is now open"
            : "Store is now temporarily closed"
        )
        router.refresh()
      } catch {
        toast.error("Failed to update store status")
      } finally {
        setIsToggling(false)
      }
    })
  }
  return (
    <>
      <div className="flex flex-row items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="space-y-0.5">
          <label className="text-base font-bold text-foreground">
            Store Status
          </label>
          <p className="text-sm text-muted-foreground">
            {optimisticIsOpen
              ? "Your store is open and accepting orders."
              : "Your store is temporarily closed. Customers cannot place orders."}
          </p>
        </div>
        <Switch
          checked={optimisticIsOpen}
          onCheckedChange={(val) => {
            setPendingStatus(val)
            setShowStatusModal(true)
          }}
          disabled={isPending || isToggling || disabled}
          className="data-[state=checked]:bg-success"
        />
      </div>
      <ConfirmDialog
        open={showStatusModal}
        onOpenChange={setShowStatusModal}
        title={pendingStatus ? "Open Store?" : "Close Store?"}
        description={
          pendingStatus
            ? "Are you sure you want to open your store? Customers will be able to place new orders."
            : "Are you sure you want to temporarily close your store? Customers will not be able to place new orders."
        }
        confirmText={pendingStatus ? "Yes, open store" : "Yes, close store"}
        isDestructive={!pendingStatus}
        onConfirm={confirmStatusChange}
      />
    </>
  )
}
