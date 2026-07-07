"use client"

import { Controller, type Control, useWatch } from "react-hook-form"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getSchoolOptions, getCampusOptions } from "@/lib/config/campus"
import { type VendorCreationValues } from "@/lib/schemas"

interface VendorLocationFieldsProps {
  control: Control<VendorCreationValues>
}

export function VendorManagerLocationFields({
  control,
}: VendorLocationFieldsProps) {
  const selectedSchool = useWatch({ control, name: "school" })
  const campusOptions = getCampusOptions(selectedSchool)

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Controller
        name="school"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>School *</FieldLabel>
            <Select
              name={field.name}
              value={field.value}
              onValueChange={field.onChange}
            >
              <SelectTrigger
                id={field.name}
                aria-invalid={fieldState.invalid}
                className="h-11 w-full rounded-xl"
              >
                <SelectValue placeholder="Select school" />
              </SelectTrigger>
              <SelectContent>
                {getSchoolOptions().map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
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
            <FieldLabel htmlFor={field.name}>Campus *</FieldLabel>
            <Select
              name={field.name}
              value={field.value}
              onValueChange={field.onChange}
            >
              <SelectTrigger
                id={field.name}
                aria-invalid={fieldState.invalid}
                className="h-11 w-full rounded-xl"
              >
                <SelectValue placeholder="Select campus" />
              </SelectTrigger>
              <SelectContent>
                {campusOptions.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
    </div>
  )
}
