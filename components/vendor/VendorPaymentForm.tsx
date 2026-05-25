"use client"

import { useState, useEffect } from "react"
import { useForm, Controller, type Resolver } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Checkbox } from "@/components/ui/checkbox"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { Vendor } from "@/lib/types"
import apiClient from "@/lib/axios"
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

  useEffect(() => {
    async function fetchBanks() {
      try {
        const response = await fetch(
          "https://api.paystack.co/bank?country=nigeria"
        )
        const json = await response.json()
        if (json.status && json.data) {
          // Add custom "Other" at the end if needed, but Paystack has almost all
          setBanks(json.data)
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
    defaultValues: {
      paymentDetails: {
        bankName: initial.paymentDetails?.bankName ?? "",
        accountNumber: initial.paymentDetails?.accountNumber ?? "",
        accountName: initial.paymentDetails?.accountName ?? "",
        acceptsCashOnDelivery:
          initial.paymentDetails?.acceptsCashOnDelivery ?? false,
      },
    },
  })

  const onSubmit = async (values: VendorPaymentSettingsValues) => {
    setSaving(true)
    try {
      await apiClient.patch("/vendor/settings", {
        paymentDetails: values.paymentDetails,
      })

      toast.success("Payment settings updated successfully")
      router.refresh()
    } catch (error: unknown) {
      console.error("Save settings error:", error)
      const err = error as Error
      toast.error(
        err.message || "Couldn't save your settings. Please try again."
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="font-heading text-lg font-bold">Bank Details</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Provide your bank details so customers can transfer money directly
            to you.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field
            data-invalid={!!form.formState.errors.paymentDetails?.bankName}
          >
            <label
              className="text-sm font-medium"
              htmlFor="paymentDetails.bankName"
            >
              Bank Name
            </label>
            <Controller
              name="paymentDetails.bankName"
              control={form.control}
              render={({ field }) => (
                <Popover open={openBankList} onOpenChange={setOpenBankList}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      disabled={loadingBanks}
                      className={cn(
                        "w-full justify-between font-normal",
                        !field.value && "text-muted-foreground",
                        !!form.formState.errors.paymentDetails?.bankName &&
                          "border-destructive ring-3 ring-destructive/20"
                      )}
                    >
                      {field.value
                        ? banks.find((bank) => bank.name === field.value)
                            ?.name || field.value
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
                          {banks.map((bank) => (
                            <CommandItem
                              key={bank.code}
                              value={bank.name}
                              onSelect={() => {
                                field.onChange(bank.name)
                                setOpenBankList(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  field.value === bank.name
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

          <Field
            data-invalid={!!form.formState.errors.paymentDetails?.accountNumber}
          >
            <label
              className="text-sm font-medium"
              htmlFor="paymentDetails.accountNumber"
            >
              Account Number
            </label>
            <Input
              {...form.register("paymentDetails.accountNumber")}
              id="paymentDetails.accountNumber"
              placeholder="e.g. 1234567890"
              maxLength={10}
              inputMode="numeric"
              pattern="[0-9]*"
              aria-invalid={
                !!form.formState.errors.paymentDetails?.accountNumber
              }
            />
          </Field>
        </div>

        <Field
          data-invalid={!!form.formState.errors.paymentDetails?.accountName}
        >
          <label
            className="text-sm font-medium"
            htmlFor="paymentDetails.accountName"
          >
            Account Name
          </label>
          <Input
            {...form.register("paymentDetails.accountName")}
            id="paymentDetails.accountName"
            placeholder="e.g. John Doe"
            aria-invalid={!!form.formState.errors.paymentDetails?.accountName}
          />
        </Field>

        <hr className="my-6 border-border" />

        <div>
          <h3 className="font-heading text-lg font-bold">Cash on Delivery</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose whether customers can pay with cash upon receiving their
            order.
          </p>
        </div>

        <Controller
          name="paymentDetails.acceptsCashOnDelivery"
          control={form.control}
          render={({ field }) => (
            <div className="flex flex-row items-start space-y-0 space-x-3 rounded-md border bg-muted/20 p-4 shadow-sm">
              <Checkbox
                id="paymentDetails.acceptsCashOnDelivery"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
              <div className="space-y-1 leading-none">
                <label
                  htmlFor="paymentDetails.acceptsCashOnDelivery"
                  className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Accept Cash on Delivery
                </label>
                <p className="text-xs text-muted-foreground">
                  Allow customers to order without upfront transfer and pay in
                  cash when the food arrives.
                </p>
              </div>
            </div>
          )}
        />
      </div>

      <div className="flex justify-end pt-4">
        <Button
          type="submit"
          variant="hero"
          disabled={saving || !form.formState.isDirty}
        >
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </form>
  )
}
