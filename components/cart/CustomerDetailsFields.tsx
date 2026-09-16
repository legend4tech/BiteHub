import { Controller, type Control, useWatch } from "react-hook-form"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Field, FieldError } from "@/components/ui/field"
import { Button } from "@/components/ui/button"
import { MapPin, Edit2, User, Phone, Mail, AlertTriangle } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { type OrderFormInputValues } from "@/lib/schemas"
import type { DeliveryZone } from "@/types/vendor"
import type { CustomerProfile } from "@/types/customer"
import { getSchoolName, getCampusName } from "@/lib/config/campus"
import { useUpdateCustomerProfile } from "@/hooks/customer/useCustomerMutations"
import { toast } from "sonner"

interface CustomerDetailsFieldsProps {
  control: Control<OrderFormInputValues>
  getValues?: () => OrderFormInputValues
  deliveryZones: DeliveryZone[]
  zonesLoading?: boolean
  customerProfile?: CustomerProfile | null
  isEditingAddress?: boolean
  setIsEditingAddress?: (val: boolean) => void
  zonesError?: boolean
  onRetryZones?: () => void
  locationMismatch?: boolean
  noZonesAvailable?: boolean
  isCrossCampus?: boolean
  isCrossSchool?: boolean
  vendorCampus?: string
  vendorSchool?: string
}

export function CustomerDetailsFields({
  control,
  deliveryZones,
  zonesLoading,
  customerProfile,
  isEditingAddress,
  setIsEditingAddress,
  zonesError,
  onRetryZones,
  locationMismatch,
  noZonesAvailable,
  isCrossCampus,
  isCrossSchool,
  vendorCampus,
  vendorSchool,
  getValues,
}: CustomerDetailsFieldsProps) {
  const formValues = useWatch({ control })
  const updateProfile = useUpdateCustomerProfile()

  const handleSave = () => {
    if (!getValues) {
      setIsEditingAddress?.(false)
      return
    }
    const values = getValues()
    updateProfile.mutate(
      {
        name: values.name,
        phone: values.phone,
        preferredLandmark: values.location,
        preferredExactLocation: values.exactLocation,
      },
      {
        onSuccess: () => {
          toast.success("Delivery details updated successfully!")
          setIsEditingAddress?.(false)
        },
        onError: (err) => {
          console.error(err)
          toast.error("Failed to update delivery details. Please try again.")
        },
      }
    )
  }

  const renderFields = () => (
    <div className="space-y-4">
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
              disabled={!!customerProfile}
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
            {zonesLoading ? (
              <div className="flex h-10 items-center rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground">
                Loading delivery zones...
              </div>
            ) : (
              <>
                <Select
                  key={`zone-select-${deliveryZones.length}`}
                  onValueChange={field.onChange}
                  value={
                    deliveryZones.length > 0
                      ? field.value || undefined
                      : undefined
                  }
                  disabled={deliveryZones.length === 0}
                >
                  <SelectTrigger
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                  >
                    <SelectValue
                      placeholder={
                        deliveryZones.length === 0
                          ? "No zones available for this vendor"
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
                {/* Show previously saved zone as a hint when no zones are available */}
                {deliveryZones.length === 0 && field.value && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Previously saved:{" "}
                    <span className="font-medium">{field.value}</span>
                  </p>
                )}
              </>
            )}
            {zonesError && (
              <p className="mt-2 flex items-center text-xs font-medium text-destructive">
                Failed to load delivery zones.
                <button
                  type="button"
                  onClick={onRetryZones}
                  className="ml-1 underline hover:text-destructive/80"
                >
                  Retry
                </button>
              </p>
            )}
            {fieldState.invalid && !zonesError && (
              <FieldError errors={[fieldState.error]} />
            )}
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
    </div>
  )

  if (customerProfile) {
    return (
      <>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Saved Information</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsEditingAddress?.(true)}
              className="h-8 gap-2 text-xs"
            >
              <Edit2 className="size-3" /> Update
            </Button>
          </div>

          <div className="relative space-y-3 overflow-hidden rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <div className="pointer-events-none absolute -top-4 -right-4 p-4 opacity-5">
              <MapPin className="size-24" />
            </div>

            <div className="flex items-start gap-3">
              <User className="mt-0.5 size-4 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-bold text-foreground">
                  {formValues.name || customerProfile.name}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="mt-0.5 size-4 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {formValues.phone || customerProfile.phone}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 size-4 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {formValues.email || customerProfile.email}
                </p>
              </div>
            </div>

            <div className="my-2 h-px bg-border" />

            <Controller
              name="location"
              control={control}
              render={({ field, fieldState }) => (
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      Delivery Location
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {field.value ||
                        customerProfile.preferredLandmark ||
                        "Not provided"}
                    </p>
                    {fieldState.invalid && (
                      <p className="mt-1 text-xs font-medium text-destructive">
                        {fieldState.error?.message}
                      </p>
                    )}
                  </div>
                </div>
              )}
            />

            <Controller
              name="exactLocation"
              control={control}
              render={({ field, fieldState }) => (
                <div className="flex items-start gap-3">
                  <div className="size-4 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Exact Address
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {field.value || "Not provided"}
                    </p>
                    {fieldState.invalid && (
                      <p className="mt-1 text-xs font-medium text-destructive">
                        {fieldState.error?.message}
                      </p>
                    )}
                  </div>
                </div>
              )}
            />

            {/* Warning banner — shown after all address fields */}
            {(noZonesAvailable || locationMismatch) && (
              <div className="flex items-start gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-primary" />
                <p className="text-xs leading-snug font-medium text-foreground">
                  {noZonesAvailable ? (
                    isCrossCampus && vendorCampus ? (
                      <>
                        This vendor is in{" "}
                        {isCrossSchool && vendorSchool
                          ? `${getSchoolName(vendorSchool)} `
                          : ""}
                        {vendorSchool
                          ? getCampusName(vendorSchool, vendorCampus)
                          : vendorCampus.charAt(0).toUpperCase() +
                            vendorCampus.slice(1)}{" "}
                        and doesn&apos;t deliver to your campus.{" "}
                        <Link
                          href="/menus"
                          className="font-medium text-primary underline underline-offset-2 hover:text-primary/80"
                        >
                          Choose a vendor near you.
                        </Link>
                      </>
                    ) : (
                      "This vendor has no delivery zones set up yet. Contact them directly."
                    )
                  ) : locationMismatch ? (
                    "Your saved zone isn't available for this vendor. Click Update to select one."
                  ) : (
                    "No delivery zone set. Click Update to add one."
                  )}
                </p>
              </div>
            )}
          </div>
        </div>

        <Dialog open={isEditingAddress} onOpenChange={setIsEditingAddress}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Update Delivery Details</DialogTitle>
              <DialogDescription>
                Make changes to your delivery information below.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">{renderFields()}</div>
            <DialogFooter>
              <Button
                type="button"
                onClick={handleSave}
                disabled={updateProfile.isPending}
              >
                {updateProfile.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  // Fallback for Guests
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Your details</p>
      </div>
      {renderFields()}
    </div>
  )
}
