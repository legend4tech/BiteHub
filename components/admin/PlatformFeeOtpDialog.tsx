"use client"

import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import apiClient from "@/lib/axios"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ShieldCheck, Loader2 } from "lucide-react"

interface PlatformFeeOtpDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (otp: string) => void
  isSubmitting: boolean
  targetFeePercentage: number
}

export function PlatformFeeOtpDialog({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
  targetFeePercentage,
}: PlatformFeeOtpDialogProps) {
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""))
  const [isResending, setIsResending] = useState(false)
  const [cooldown, setCooldown] = useState(60)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (isOpen) {
      // Reset inputs & focus first cell on open
      const timer = setTimeout(() => {
        setOtp(Array(6).fill(""))
        inputRefs.current[0]?.focus()
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  const isCooldownActive = cooldown > 0

  useEffect(() => {
    if (!isOpen || !isCooldownActive) return

    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    return () => clearInterval(timer)
  }, [isOpen, isCooldownActive])

  const handleChange = (index: number, value: string) => {
    const numeric = value.replace(/\D/g, "")
    if (!numeric && value !== "") return

    const newOtp = [...otp]

    if (numeric.length > 1) {
      // Pasted multiple digits in single field
      const digits = numeric.slice(0, 6).split("")
      for (let i = 0; i < 6; i++) {
        newOtp[i] = digits[i] || ""
      }
      setOtp(newOtp)
      const nextIndex = Math.min(digits.length, 5)
      inputRefs.current[nextIndex]?.focus()
      return
    }

    newOtp[index] = numeric.slice(-1)
    setOtp(newOtp)

    if (numeric && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "")
    if (!pastedData) return

    const digits = pastedData.slice(0, 6).split("")
    const newOtp = [...otp]
    for (let i = 0; i < 6; i++) {
      newOtp[i] = digits[i] || ""
    }
    setOtp(newOtp)
    const nextIndex = Math.min(digits.length, 5)
    inputRefs.current[nextIndex]?.focus()
  }

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return
    setIsResending(true)
    try {
      await apiClient.post("/admin/settings/global/request-otp")
      toast.success("A new verification code has been sent to your email.")
      setCooldown(60)
      setOtp(Array(6).fill(""))
      inputRefs.current[0]?.focus()
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } }
      toast.error(
        error.response?.data?.error || "Failed to resend verification code"
      )
    } finally {
      setIsResending(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const fullCode = otp.join("")
    if (fullCode.length !== 6) {
      toast.error("Please enter a valid 6-digit code.")
      return
    }
    onConfirm(fullCode)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShieldCheck className="size-6" />
          </div>
          <DialogTitle className="text-center font-heading text-lg font-bold">
            Security Verification Required
          </DialogTitle>
          <DialogDescription className="text-center text-sm">
            Changing the global commission fee to{" "}
            <strong>{targetFeePercentage}%</strong> impacts all future vendor
            payouts. Enter the 6-digit authorization code sent to your
            registered email address.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* 6-Digit Segmented OTP Input */}
          <div
            className="flex justify-center gap-2 py-2 sm:gap-3"
            onPaste={handlePaste}
          >
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={isSubmitting}
                className="h-12 w-11 rounded-lg border border-input bg-background text-center font-mono text-xl font-bold text-foreground transition-all duration-200 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 sm:h-14 sm:w-12 sm:text-2xl"
              />
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Code valid for 15 minutes</span>
            <button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0 || isResending}
              className="font-medium text-primary hover:underline disabled:opacity-50"
            >
              {isResending
                ? "Sending..."
                : cooldown > 0
                  ? `Resend code in ${cooldown}s`
                  : "Resend code"}
            </button>
          </div>

          <DialogFooter className="mt-6 gap-3 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={otp.join("").length !== 6 || isSubmitting}
              className="px-5"
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : null}
              Authorize & Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
