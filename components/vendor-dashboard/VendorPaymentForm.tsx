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
import {
  useVendorAddMonnify,
  useVendorRequestMonnifyChange,
  useVendorVerifyMonnifyChange,
} from "@/hooks/mutations/useVendorMutations"
import axios from "axios"
import { useRouter } from "next/navigation"
import { useBanksQuery } from "@/hooks/queries/useBanksQuery"
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
import { useMonnifyAccountValidation } from "@/hooks/useMonnifyAccountValidation"
import { VendorPaymentInfoCard } from "./VendorPaymentInfoCard"

interface Bank {
  name: string
  code: string
}

interface VendorPaymentFormProps {
  initial: Vendor
}

export function VendorPaymentForm({ initial }: VendorPaymentFormProps) {
  const [saving, setSaving] = useState(false)
  const { data: banks = [], isLoading: loadingBanks } = useBanksQuery()
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

  const form = useForm<VendorPaymentSettingsValues>({
    resolver: zodResolver(
      vendorPaymentSettingsSchema as never
    ) as unknown as Resolver<VendorPaymentSettingsValues>,
    mode: "onChange",
    defaultValues: {
      bankCode: initial.monnifyBankCode ?? "",
      accountNumber: initial.monnifyAccountNumber ?? "", // Bug fix: previously used initial.accountNumber
    },
  })

  const watchedBankCode = form.watch("bankCode")
  const watchedAccountNumber = form.watch("accountNumber")

  const { accountName, isFetchingName, isNameValid, nameError } =
    useMonnifyAccountValidation(watchedAccountNumber, watchedBankCode)

  // Start the flow — values are not used here; they're read via form.getValues() in the confirm handlers
  const onSubmit = async (_values: VendorPaymentSettingsValues) => {
    if (initial.monnifyIntegrationStatus === "active") {
      setShowOtpRequestModal(true)
    } else {
      setShowSetupModal(true)
    }
  }

  const addMonnifyMutation = useVendorAddMonnify()

  // Final Setup Confirm
  const handleSetupConfirm = () => {
    if (
      setupConfirmText.trim().toLowerCase().replace(/\s+/g, " ") !==
      "add account"
    )
      return

    setSaving(true)
    const values = form.getValues()
    const bankName = banks.find((b) => b.code === values.bankCode)?.name

    addMonnifyMutation.mutate(
      {
        vendorId: initial.id,
        data: {
          bankCode: values.bankCode,
          accountNumber: values.accountNumber,
          bankName,
        },
      },
      {
        onSuccess: () => {
          toast.success(
            "Monnify connected successfully! Check your email for confirmation."
          )
          setShowSetupModal(false)
          setSetupConfirmText("")
          router.refresh()
        },
        onError: (error: unknown) => {
          const err = error as { response?: { data?: { error?: string } } }
          console.error("Save settings error:", err)
          toast.error(
            err.response?.data?.error ||
              "Couldn't connect to Monnify. Please try again."
          )
        },
        onSettled: () => {
          setSaving(false)
        },
      }
    )
  }

  const requestMonnifyChangeMutation = useVendorRequestMonnifyChange()

  // Step 1: Request OTP
  const handleRequestOtp = () => {
    setRequestingOtp(true)
    requestMonnifyChangeMutation.mutate(initial.id, {
      onSuccess: () => {
        toast.success("OTP sent to your registered email!")
        setShowOtpRequestModal(false)
        setShowVerifyModal(true)
      },
      onError: (error: unknown) => {
        const err = error as { response?: { data?: { error?: string } } }
        toast.error(err.response?.data?.error || "Failed to request OTP.")
      },
      onSettled: () => {
        setRequestingOtp(false)
      },
    })
  }

  const verifyMonnifyChangeMutation = useVendorVerifyMonnifyChange()

  // Step 2: Verify OTP
  const handleVerifyConfirm = () => {
    if (
      changeConfirmText.trim().toLowerCase().replace(/\s+/g, " ") !==
        "change account" ||
      !otpValue
    )
      return

    setSaving(true)
    const values = form.getValues()
    const bankName = banks.find((b) => b.code === values.bankCode)?.name

    verifyMonnifyChangeMutation.mutate(
      {
        vendorId: initial.id,
        data: {
          bankCode: values.bankCode,
          bankName,
          accountNumber: values.accountNumber,
          otp: otpValue,
        },
      },
      {
        onSuccess: () => {
          toast.success("Bank details updated successfully!")
          setShowVerifyModal(false)
          setOtpValue("")
          setChangeConfirmText("")
          router.refresh()
        },
        onError: (error: unknown) => {
          const err = error as { response?: { data?: { error?: string } } }
          console.error("Verify OTP error:", err)
          toast.error(
            err.response?.data?.error ||
              "Failed to update details. Invalid OTP."
          )
        },
        onSettled: () => {
          setSaving(false)
        },
      }
    )
  }

  return (
    <div className="space-y-6">
      <VendorPaymentInfoCard
        integrationStatus={initial.monnifyIntegrationStatus}
        subAccountCode={initial.monnifySubAccountCode}
        isLocked={isLocked}
        daysLeft={daysLeft}
        configuredBankCode={initial.monnifyBankCode}
        configuredAccountNumber={initial.monnifyAccountNumber}
        banks={banks}
      />

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
                disabled={isLocked || isFetchingName}
                aria-invalid={!!form.formState.errors.accountNumber}
              />
            </Field>

            <Field className="md:col-span-2" data-invalid={!!nameError}>
              <label className="text-sm font-medium" htmlFor="accountName">
                Account Name
              </label>
              <div className="relative">
                <Input
                  id="accountName"
                  value={
                    isFetchingName ? "Verifying account..." : accountName || ""
                  }
                  readOnly
                  disabled
                  placeholder="Auto-filled after verifying"
                  className={cn(
                    isNameValid &&
                      "border-green-500/50 bg-green-500/10 text-green-700 dark:bg-green-500/20 dark:text-green-400",
                    nameError && "border-destructive ring-3 ring-destructive/20"
                  )}
                />
                {isFetchingName && (
                  <Loader2 className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                )}
                {isNameValid && !isFetchingName && (
                  <CheckCircle className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-green-600 dark:text-green-400" />
                )}
              </div>
              {nameError && (
                <p className="mt-1.5 text-xs text-destructive">{nameError}</p>
              )}
            </Field>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3 pt-4">
          <Button
            type="submit"
            variant="hero"
            disabled={
              !form.formState.isDirty ||
              !form.formState.isValid ||
              isLocked ||
              !isNameValid ||
              isFetchingName ||
              saving
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
