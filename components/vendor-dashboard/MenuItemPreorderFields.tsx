import { Control, Controller, UseFormWatch } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import type { MenuItemFormValues } from "@/lib/schemas"

interface MenuItemPreorderFieldsProps {
  control: Control<MenuItemFormValues>
  watch: UseFormWatch<MenuItemFormValues>
}

export function MenuItemPreorderFields({
  control,
  watch,
}: MenuItemPreorderFieldsProps) {
  return (
    <div className="space-y-4 rounded-xl border bg-muted/10 p-4">
      <Controller
        name="isPreorder"
        control={control}
        render={({ field, fieldState }) => (
          <Field orientation="horizontal" data-invalid={fieldState.invalid}>
            <Switch
              id={field.name}
              checked={field.value}
              onCheckedChange={field.onChange}
              aria-invalid={fieldState.invalid}
            />
            <div className="flex flex-col">
              <FieldLabel htmlFor={field.name} className="cursor-pointer">
                Pre-order Item
              </FieldLabel>
              <span className="mt-1 text-xs text-muted-foreground">
                Tip: If this meal takes 2 or more hours to prepare, it is highly
                recommended to mark it as a Pre-order.
              </span>
            </div>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      {watch("isPreorder") && (
        <div className="grid grid-cols-1 gap-4 border-t pt-4 md:grid-cols-2">
          <Controller
            name="preorderEndDate"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>
                  Closing Date & Time
                </FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  type="datetime-local"
                  aria-invalid={fieldState.invalid}
                  onClick={(e) => {
                    try {
                      e.currentTarget.showPicker()
                    } catch {}
                  }}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="preorderDeliveryInfo"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Delivery Schedule</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  type="text"
                  placeholder="e.g. Delivery on Tuesday"
                  aria-invalid={fieldState.invalid}
                />
                <span className="text-[11px] text-muted-foreground">
                  Optional: Leave blank to use the closing date automatically.
                </span>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>
      )}
    </div>
  )
}
