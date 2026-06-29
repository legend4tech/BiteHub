import { Controller, type Control } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Field, FieldError } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { type OrderFormInputValues } from "@/lib/schemas"

interface DeliveryZone {
  id: string
  name: string
  fee: number
  subLandmarks: { id: string; name: string; fee: number }[]
}

interface CustomerDetailsFieldsProps {
  control: Control<OrderFormInputValues>
  deliveryZones: DeliveryZone[]
}

export function CustomerDetailsFields({
  control,
  deliveryZones,
}: CustomerDetailsFieldsProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold">Your details</p>

      <Controller
        name="name"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <label className="text-sm font-medium" htmlFor={field.name}>
              Full Name <span className="text-destructive">*</span>
            </label>
            <Input
              {...field}
              id={field.name}
              placeholder="e.g. John Doe"
              aria-invalid={fieldState.invalid}
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
            <label className="text-sm font-medium" htmlFor={field.name}>
              Email Address <span className="text-destructive">*</span>
            </label>
            <Input
              {...field}
              id={field.name}
              type="email"
              placeholder="For your receipt"
              aria-invalid={fieldState.invalid}
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
            <label className="text-sm font-medium" htmlFor={field.name}>
              Phone Number <span className="text-destructive">*</span>
            </label>
            <Input
              {...field}
              id={field.name}
              type="tel"
              placeholder="e.g. 08012345678"
              aria-invalid={fieldState.invalid}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="location"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <label className="text-sm font-medium" htmlFor={field.name}>
              Nearest Landmark (Delivery Zone){" "}
              <span className="text-destructive">*</span>
            </label>
            <Select
              onValueChange={field.onChange}
              value={field.value}
              disabled={deliveryZones.length === 0}
            >
              <SelectTrigger id={field.name} aria-invalid={fieldState.invalid}>
                <SelectValue
                  placeholder={
                    deliveryZones.length === 0
                      ? "No delivery zones available"
                      : "Select delivery zone"
                  }
                />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {deliveryZones.map((zone) => (
                  <SelectGroup key={zone.id}>
                    <SelectItem
                      value={zone.name}
                      className="font-bold text-foreground"
                    >
                      <span className="ml-1">{zone.name}</span>
                    </SelectItem>
                    {zone.subLandmarks.map((sub) => (
                      <SelectItem
                        key={sub.id}
                        value={`${zone.name} - ${sub.name}`}
                      >
                        <span className="ml-4 text-muted-foreground">
                          {sub.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="exactLocation"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <label className="text-sm font-medium" htmlFor={field.name}>
              Exact Location (Lodge Name){" "}
              <span className="text-destructive">*</span>
            </label>
            <Input
              {...field}
              id={field.name}
              placeholder="e.g. Block C, Room 4, SUG Lodge"
              aria-invalid={fieldState.invalid}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="notes"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <Textarea
              {...field}
              id={field.name}
              placeholder="Notes for vendor (optional)"
              rows={2}
              className="resize-none"
              aria-invalid={fieldState.invalid}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold">Pay with Monnify</h4>
            <p className="text-xs text-muted-foreground">
              Secure, automated payments
            </p>
          </div>
          <div className="flex h-8 items-center rounded bg-white px-2 shadow-sm">
            <span className="font-bold text-primary">monnify</span>
          </div>
        </div>
      </div>
    </div>
  )
}
