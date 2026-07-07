"use client"

import { useState } from "react"
import { Controller, type Control, useWatch } from "react-hook-form"
import { Eye, EyeOff } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import { PasswordStrengthMeter } from "@/components/shared/PasswordStrengthMeter"
import { type VendorCreationValues } from "@/lib/schemas"

// You'll need to define this interface based on the parent form's schema
// Using any for Control here to keep it flexible, but it's better to use the exact type
interface VendorAccountFieldsProps {
  control: Control<VendorCreationValues>
}

export function VendorManagerAccountFields({
  control,
}: VendorAccountFieldsProps) {
  const [showPassword, setShowPassword] = useState(false)
  const passwordValue = useWatch({ control, name: "password" })

  return (
    <div className="space-y-4 border-t border-border pt-6">
      <h3 className="font-heading text-lg font-semibold">
        Account Credentials
      </h3>

      <Controller
        name="email"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Email *</FieldLabel>
            <Input
              {...field}
              id={field.name}
              type="email"
              placeholder="vendor@email.com"
              aria-invalid={fieldState.invalid}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="password"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Password *</FieldLabel>
            <div className="relative">
              <Input
                {...field}
                id={field.name}
                type={showPassword ? "text" : "password"}
                placeholder="Min. 8 chars, uppercase, number, symbol"
                aria-invalid={fieldState.invalid}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            <PasswordStrengthMeter password={passwordValue ?? ""} />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
    </div>
  )
}
