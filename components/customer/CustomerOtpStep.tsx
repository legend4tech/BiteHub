"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, MailCheck, ArrowLeft, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import axios from "axios"

interface CustomerOtpStepProps {
  email: string
  onVerified: () => Promise<void> | void
  onBack: () => void
  onChangeEmail?: (newEmail: string) => Promise<void>
}

export function CustomerOtpStep({
  email,
  onVerified,
  onBack,
  onChangeEmail,
}: CustomerOtpStepProps) {
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""])
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const [isEditingEmail, setIsEditingEmail] = useState(false)
  const [newEmail, setNewEmail] = useState(email)
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    // Auto-focus first input
    inputRefs.current[0]?.focus()
  }, [])

  useEffect(() => {
    if (countdown <= 0) return
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [countdown])

  const handleChange = (index: number, value: string) => {
    // Only accept numeric characters
    const numeric = value.replace(/\D/g, "")
    if (!numeric && value !== "") return

    const newOtp = [...otp]

    if (numeric.length > 1) {
      // Pasted multiple digits
      const digits = numeric.slice(0, 6).split("")
      for (let i = 0; i < 6; i++) {
        newOtp[i] = digits[i] || ""
      }
      setOtp(newOtp)
      const nextIndex = Math.min(digits.length, 5)
      inputRefs.current[nextIndex]?.focus()

      if (digits.length === 6) {
        handleVerifyOtp(digits.join(""))
      }
      return
    }

    newOtp[index] = numeric.slice(-1)
    setOtp(newOtp)

    if (numeric && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    const fullCode = newOtp.join("")
    if (fullCode.length === 6) {
      handleVerifyOtp(fullCode)
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

    if (digits.length === 6) {
      handleVerifyOtp(digits.join(""))
    }
  }

  const handleVerifyOtp = async (codeToVerify?: string) => {
    const code = codeToVerify || otp.join("")
    if (code.length !== 6) {
      toast.error("Please enter the complete 6-digit verification code.")
      return
    }

    setIsVerifying(true)
    try {
      const res = await axios.post("/api/auth/customer/verify-otp", {
        email,
        otp: code,
      })

      toast.success(res.data?.message || "Email verified successfully!")
      await onVerified()
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { error?: string } }
      }
      toast.error(
        err?.response?.data?.error ||
          "Invalid or expired code. Please check and try again."
      )
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResend = async () => {
    if (countdown > 0 || isResending) return

    setIsResending(true)
    try {
      const res = await axios.post("/api/auth/customer/resend-otp", { email })
      toast.success(
        res.data?.message || "A new code has been sent to your email."
      )
      setCountdown(60)
      setOtp(["", "", "", "", "", ""])
      inputRefs.current[0]?.focus()
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { error?: string } }
      }
      toast.error(
        err?.response?.data?.error ||
          "Could not resend code. Please wait a moment and try again."
      )
    } finally {
      setIsResending(false)
    }
  }

  const handleUpdateEmail = async () => {
    const trimmed = newEmail.trim().toLowerCase()
    if (!trimmed || !trimmed.includes("@") || !trimmed.includes(".")) {
      toast.error("Please enter a valid email address.")
      return
    }

    setIsUpdatingEmail(true)
    try {
      if (trimmed === email.toLowerCase()) {
        // Same email: trigger a fresh code resend
        await axios.post("/api/auth/customer/resend-otp", { email })
        toast.success("A fresh verification code has been sent to your email.")
      } else if (onChangeEmail) {
        await onChangeEmail(trimmed)
      } else {
        onBack()
        return
      }

      setIsEditingEmail(false)
      setCountdown(60)
      setOtp(["", "", "", "", "", ""])
      inputRefs.current[0]?.focus()
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { error?: string } }
      }
      toast.error(
        err?.response?.data?.error ||
          "Could not update or send code. Please try again."
      )
    } finally {
      setIsUpdatingEmail(false)
    }
  }

  return (
    <div className="block space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-primary/10">
          <MailCheck className="size-6 text-primary" />
        </div>
        <h2 className="font-heading text-xl font-bold tracking-tight">
          Verify your email
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          We sent a 6-digit code to{" "}
          <span className="font-medium text-foreground">{email}</span>
        </p>
      </div>

      {isEditingEmail ? (
        <div className="space-y-4">
          <div className="space-y-1.5 text-left">
            <label
              htmlFor="inlineNewEmail"
              className="text-xs font-medium text-foreground"
            >
              New Email Address
            </label>
            <input
              id="inlineNewEmail"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={isUpdatingEmail}
              autoFocus
              className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground transition-all duration-200 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-10 flex-1 text-sm"
              disabled={isUpdatingEmail}
              onClick={() => {
                setNewEmail(email)
                setIsEditingEmail(false)
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="hero"
              className="h-10 flex-1 text-sm"
              disabled={isUpdatingEmail || !newEmail.trim()}
              onClick={handleUpdateEmail}
            >
              {isUpdatingEmail ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Updating…
                </>
              ) : (
                "Update & Resend"
              )}
            </Button>
          </div>
          <div className="pt-1 text-center">
            <button
              type="button"
              onClick={onBack}
              disabled={isUpdatingEmail}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground hover:underline"
            >
              Edit all registration info
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* 6 Digit Input Group */}
          <div
            className="flex justify-center gap-2 sm:gap-3"
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
                disabled={isVerifying}
                className="h-12 w-11 rounded-lg border border-input bg-background text-center font-mono text-xl font-bold text-foreground transition-all duration-200 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 sm:h-14 sm:w-12 sm:text-2xl"
              />
            ))}
          </div>

          {/* Submit Button */}
          <Button
            type="button"
            variant="hero"
            className="h-11 w-full text-base"
            onClick={() => handleVerifyOtp()}
            disabled={isVerifying || otp.join("").length !== 6}
          >
            {isVerifying ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Verifying…
              </>
            ) : (
              "Verify & Continue"
            )}
          </Button>

          {/* Resend and Navigation Actions */}
          <div className="flex flex-col items-center gap-3 pt-2 text-sm text-muted-foreground">
            {countdown > 0 ? (
              <span className="text-xs">
                Resend code in{" "}
                <strong className="text-foreground">{countdown}s</strong>
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="flex items-center gap-1.5 text-xs font-semibold text-primary transition-colors hover:underline disabled:opacity-50"
              >
                {isResending ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <RefreshCw className="size-3" />
                )}
                Resend code
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setNewEmail(email)
                if (onChangeEmail) {
                  setIsEditingEmail(true)
                } else {
                  onBack()
                }
              }}
              disabled={isVerifying}
              className="mt-1 flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-3" />
              Change email address
            </button>
          </div>
        </>
      )}
    </div>
  )
}
