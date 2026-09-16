"use client"

import { useActionState, useEffect } from "react"
import { activateWallet } from "@/lib/actions/wallet"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

export function ActivateWalletForm() {
  const [state, formAction, isPending] = useActionState(
    activateWallet,
    undefined
  )

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error)
    } else if (state?.success) {
      toast.success("Wallet activated successfully!")
    }
  }, [state])

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="space-y-2">
        <label htmlFor="nin" className="text-sm font-medium">
          National Identity Number (NIN)
        </label>
        <input
          type="text"
          id="nin"
          name="nin"
          required
          minLength={11}
          maxLength={11}
          placeholder="Enter your 11-digit NIN"
          disabled={isPending}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50"
        />
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <span className="text-warning">⚠️</span>
          BiteHub does not save your NIN. It is only required by our payment
          partner for wallet activation, following CBN rules.
        </p>
      </div>
      <Button
        type="submit"
        variant="hero"
        className="w-full"
        disabled={isPending}
      >
        {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
        Activate Naira Wallet
      </Button>
    </form>
  )
}
