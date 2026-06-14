"use client"

import { useState, useEffect } from "react"
import { useForm, Controller, type Resolver } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import {
  Check,
  ChevronsUpDown,
  Loader2,
  CheckCircle,
  Lock,
  CalendarClock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { Vendor } from "@/lib/types"
import apiClient from "@/lib/axios"
import axios from "axios"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  vendorPaymentSettingsSchema,
  type VendorPaymentSettingsValues,
} from "@/lib/schemas"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { VendorPaymentModals } from "./VendorPaymentModals"

interface Bank {
  name: string
  code: string
}

interface VendorPaymentFormProps {
  initial: Vendor
}

export function VendorPaymentForm({ initial }: VendorPaymentFormProps) {
  const [saving, setSaving] = useState(false)
  const [banks, setBanks] = useState<Bank[]>([])
  const [loadingBanks, setLoadingBanks] = useState(true)
  const [openBankList, setOpenBankList] = useState(false)
  const router = useRouter()

  // State for modals
  const [showSetupModal, setShowSetupModal] = useState(false)
  const [setupConfirmText, setSetupConfirmText] = useState("")

  const [showOtpRequestModal, setShowOtpRequestModal] = useState(false)
  const [requestingOtp, setRequestingOtp] = useState(false)

  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const [otpValue, setOtpValue] = useState("")
  const [changeConfirmText, setChangeConfirmText] = useState("")

  // Calculate Lock status
  const lockDays = Number(process.env.NEXT_PUBLIC_BANK_UPDATE_LOCK_DAYS || 14)
  const lastUpdate = initial.lastBankUpdateAt
    ? new Date(initial.lastBankUpdateAt)
    : null
  const lockExpiry = lastUpdate
    ? new Date(lastUpdate.getTime() + lockDays * 24 * 60 * 60 * 1000)
    : null
  const isLocked = lockExpiry ? new Date() < lockExpiry : false
  const daysLeft = lockExpiry
    ? Math.ceil(
        (lockExpiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )
    : 0

  useEffect(() => {
    async function fetchBanks() {
      try {
        const response = await axios.get("/api/banks")
        if (response.data?.status && response.data?.data) {
          setBanks(response.data.data)
        }
      } catch (error) {
        console.error("Failed to fetch banks", error)
      } finally {
        setLoadingBanks(false)
      }
    }
    fetchBanks()
  }, [])

  const form = useForm<VendorPaymentSettingsValues>({
    resolver: zodResolver(
      vendorPaymentSettingsSchema as never
    ) as unknown as Resolver<VendorPaymentSettingsValues>,
    mode: "onChange",
    defaultValues: {
      bankCode: initial.monnifyBankCode ?? "",
      accountNumber: initial.accountNumber ?? "",
    },
  })

  // Start the flow — values are not used here; they're read via form.getValues() in the confirm handlers
  const onSubmit = async (_values: VendorPaymentSettingsValues) => {
    if (initial.monnifyIntegrationStatus === "active") {
      setShowOtpRequestModal(true)
    } else {
      setShowSetupModal(true)
    }
  }

  // Final Setup Confirm
  const handleSetupConfirm = async () => {
    if (setupConfirmText.toLowerCase() !== "add account") return

    setSaving(true)
    try {
      const values = form.getValues()
      const bankName = banks.find((b) => b.code === values.bankCode)?.name
      await apiClient.post(`/vendors/${initial.id}/monnify`, {
        bankCode: values.bankCode,
        accountNumber: values.accountNumber,
        bankName,
      })

      toast.success(
        "Monnify connected successfully! Check your email for confirmation."
      )
      setShowSetupModal(false)
      setSetupConfirmText("")
      router.refresh()
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } }
      console.error("Save settings error:", err)
      toast.error(
        err.response?.data?.error ||
          "Couldn't connect to Monnify. Please try again."
      )
    } finally {
      setSaving(false)
    }
  }

  // Step 1: Request OTP
  const handleRequestOtp = async () => {
    setRequestingOtp(true)
    try {
      await apiClient.post(`/vendors/${initial.id}/monnify/request-change`)
      toast.success("OTP sent to your registered email!")
      setShowOtpRequestModal(false)
      setShowVerifyModal(true)
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } }
      toast.error(err.response?.data?.error || "Failed to request OTP.")
    } finally {
      setRequestingOtp(false)
    }
  }

  // Step 2: Verify OTP
  const handleVerifyConfirm = async () => {
    if (changeConfirmText.toLowerCase() !== "change account" || !otpValue)
      return

    setSaving(true)
    try {
      const values = form.getValues()
      const bankName = banks.find((b) => b.code === values.bankCode)?.name
      await apiClient.post(`/vendors/${initial.id}/monnify/verify-change`, {
        bankCode: values.bankCode,
        bankName,
        accountNumber: values.accountNumber,
        otp: otpValue,
      })

      toast.success("Bank details updated successfully!")
      setShowVerifyModal(false)
      setOtpValue("")
      setChangeConfirmText("")
      router.refresh()
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } }
      console.error("Verify OTP error:", err)
      toast.error(
        err.response?.data?.error || "Failed to update details. Invalid OTP."
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
        <h3 className="font-heading text-lg font-bold">Monnify Integration</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {initial.monnifyIntegrationStatus === "active"
            ? "Your account is successfully connected to Monnify! Customers can pay you securely."
            : "Connect your bank account to start receiving automated payments."}
        </p>

        <div className="mt-4 rounded-xl border border-border/50 bg-background/50 p-4 text-sm text-muted-foreground shadow-sm">
          <p className="flex items-center font-semibold text-foreground">
            <CalendarClock className="mr-2 size-4 text-primary" />
            Payout Schedule
          </p>
          <ul className="mt-2 list-outside list-disc space-y-1 pl-4">
            <li>
              Funds are settled into your bank account{" "}
              <strong>every single day</strong>.
            </li>
            <li>This includes weekends and public holidays.</li>
            <li>
              Settlements usually run around <strong>10:00 PM daily</strong>.
            </li>
          </ul>
        </div>

        {initial.monnifyIntegrationStatus === "active" && (
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <CheckCircle className="size-3.5" /> Active Subaccount:{" "}
              {initial.monnifySubAccountCode}
            </span>
          </div>
        )}

        {isLocked && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground shadow-sm">
            <Lock className="mt-0.5 size-4 shrink-0 text-primary" />
            <p>
              For your security, your payout details are protected and cannot be
              changed for{" "}
              <strong>
                {daysLeft} more day{daysLeft !== 1 ? "s" : ""}
              </strong>
              . You can safely update them once this period ends.
            </p>
          </div>
        )}
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field data-invalid={!!form.formState.errors.bankCode}>
              <label className="text-sm font-medium" htmlFor="bankCode">
                Bank
              </label>
              <Controller
                name="bankCode"
                control={form.control}
                render={({ field }) => (
                  <Popover open={openBankList} onOpenChange={setOpenBankList}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        disabled={loadingBanks || isLocked}
                        className={cn(
                          "w-full justify-between font-normal",
                          !field.value && "text-muted-foreground",
                          !!form.formState.errors.bankCode &&
                            "border-destructive ring-3 ring-destructive/20"
                        )}
                      >
                        {field.value
                          ? banks.find((bank) => bank.code === field.value)
                              ?.name || "Select a bank"
                          : loadingBanks
                            ? "Loading banks..."
                            : "Select a bank"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full min-w-[300px] p-0">
                      <Command>
                        <CommandInput placeholder="Search bank..." />
                        <CommandList>
                          <CommandEmpty>No bank found.</CommandEmpty>
                          <CommandGroup>
                            {banks.map((bank, index) => (
                              <CommandItem
                                key={`${bank.code}-${index}`}
                                value={bank.name}
                                onSelect={() => {
                                  field.onChange(bank.code)
                                  setOpenBankList(false)
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value === bank.code
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {bank.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
              />
            </Field>

            <Field data-invalid={!!form.formState.errors.accountNumber}>
              <label className="text-sm font-medium" htmlFor="accountNumber">
                Account Number
              </label>
              <Input
                {...form.register("accountNumber")}
                id="accountNumber"
                placeholder="e.g. 1234567890"
                maxLength={10}
                inputMode="numeric"
                pattern="[0-9]*"
                disabled={isLocked}
                aria-invalid={!!form.formState.errors.accountNumber}
              />
            </Field>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3 pt-4">
          <Button
            type="submit"
            variant="hero"
            disabled={
              !form.formState.isDirty || !form.formState.isValid || isLocked
            }
          >
            {isLocked
              ? "Locked"
              : initial.monnifyIntegrationStatus === "active"
                ? "Update Details"
                : "Connect Bank"}
          </Button>
        </div>
      </form>

      <VendorPaymentModals
        showSetupModal={showSetupModal}
        setShowSetupModal={setShowSetupModal}
        setupConfirmText={setupConfirmText}
        setSetupConfirmText={setSetupConfirmText}
        handleSetupConfirm={handleSetupConfirm}
        saving={saving}
        lockDays={lockDays}
        showOtpRequestModal={showOtpRequestModal}
        setShowOtpRequestModal={setShowOtpRequestModal}
        handleRequestOtp={handleRequestOtp}
        requestingOtp={requestingOtp}
        showVerifyModal={showVerifyModal}
        setShowVerifyModal={setShowVerifyModal}
        otpValue={otpValue}
        setOtpValue={setOtpValue}
        changeConfirmText={changeConfirmText}
        setChangeConfirmText={setChangeConfirmText}
        handleVerifyConfirm={handleVerifyConfirm}
      />
    </div>
  )
}
