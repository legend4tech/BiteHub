import { Controller, type Control } from "react-hook-form"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import { type MenuItemFormValues } from "@/lib/schemas"

interface MenuItemChecklistsProps {
  control: Control<MenuItemFormValues>
}

export function MenuItemChecklists({ control }: MenuItemChecklistsProps) {
  return (
    <>
      <Controller
        name="availableDays"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>Days Available</FieldLabel>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                "Sunday",
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
              ].map((day) => (
                <label key={day} className="flex items-center space-x-2">
                  <Checkbox
                    checked={field.value?.includes(day)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        field.onChange([...(field.value || []), day])
                      } else {
                        field.onChange(
                          (field.value || []).filter((d) => d !== day)
                        )
                      }
                    }}
                  />
                  <span className="text-sm leading-none font-medium">
                    {day}
                  </span>
                </label>
              ))}
            </div>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
    </>
  )
}
