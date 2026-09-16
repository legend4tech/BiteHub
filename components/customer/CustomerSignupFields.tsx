import { useState } from "react"
import { Controller, type Control } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Eye, EyeOff } from "lucide-react"
import { PasswordStrengthMeter } from "@/components/shared/PasswordStrengthMeter"
import { getSchoolOptions, getCampusOptions } from "@/lib/config/campus"
import type { CustomerSignupFormValues } from "@/lib/schemas"

export function Step1Fields({
  control,
}: {
  control: Control<CustomerSignupFormValues>
}) {
  return (
    <>
      <Controller
        name="name"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Full Name</FieldLabel>
            <Input
              {...field}
              id={field.name}
              placeholder="John Doe"
              autoComplete="name"
              aria-invalid={fieldState.invalid}
              className="h-11"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="email"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Email Address</FieldLabel>
            <Input
              {...field}
              id={field.name}
              type="email"
              placeholder="you@example.com"
              autoComplete="username"
              aria-invalid={fieldState.invalid}
              className="h-11"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="phone"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>
              Phone Number (Active on WhatsApp & Calls)
            </FieldLabel>
            <Input
              {...field}
              id={field.name}
              type="tel"
              placeholder="08012345678"
              autoComplete="tel"
              aria-invalid={fieldState.invalid}
              className="h-11"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
    </>
  )
}

export function Step2Fields({
  control,
  selectedSchool,
  passwordValue,
  setValue,
}: {
  control: Control<CustomerSignupFormValues>
  selectedSchool: string
  passwordValue: string
  setValue: (name: keyof CustomerSignupFormValues, value: string) => void
}) {
  const [showPw, setShowPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)

  return (
    <>
      <Controller
        name="school"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>School</FieldLabel>
            <Select
              onValueChange={(val) => {
                field.onChange(val)
                setValue("campus", "")
              }}
              value={field.value}
            >
              <SelectTrigger id={field.name} className="h-11">
                <SelectValue placeholder="Select your school" />
              </SelectTrigger>
              <SelectContent>
                {getSchoolOptions().map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="campus"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Campus</FieldLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value}
              disabled={!selectedSchool}
            >
              <SelectTrigger id={field.name} className="h-11">
                <SelectValue placeholder="Select your campus" />
              </SelectTrigger>
              <SelectContent>
                {getCampusOptions(selectedSchool).map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="password"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Password</FieldLabel>
            <div className="relative">
              <Input
                {...field}
                id={field.name}
                type={showPw ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="new-password"
                aria-invalid={fieldState.invalid}
                className="h-11 pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPw((p) => !p)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              >
                {showPw ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            <PasswordStrengthMeter password={passwordValue} />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="confirmPassword"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Confirm Password</FieldLabel>
            <div className="relative">
              <Input
                {...field}
                id={field.name}
                type={showConfirmPw ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="new-password"
                aria-invalid={fieldState.invalid}
                className="h-11 pr-11"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPw((p) => !p)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              >
                {showConfirmPw ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
    </>
  )
}
