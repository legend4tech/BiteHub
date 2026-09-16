"use client"

import { useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Field, FieldError } from "@/components/ui/field"
import { toast } from "sonner"
import { useCustomerProfile } from "@/hooks/customer/useCustomerProfile"
import { useUpdateCustomerProfile } from "@/hooks/customer/useCustomerMutations"
import { Loader2, GraduationCap, MapPin, Lock } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getSchoolName, getCampusName } from "@/lib/config/campus"
import { useSystemLandmarks } from "@/hooks/shared/useLandmarks"
import type { AxiosError } from "axios"

export function CustomerDeliveryForm() {
  const { data: profile, isLoading, error } = useCustomerProfile()
  const updateProfile = useUpdateCustomerProfile()

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm({
    values: {
      preferredLandmark: profile?.preferredLandmark || "",
      preferredExactLocation: profile?.preferredExactLocation || "",
    },
    defaultValues: {
      preferredLandmark: "",
      preferredExactLocation: "",
    },
  })

  // Use profile campus/school directly — these are locked and not editable
  const { data: systemLandmarks = [], isLoading: loadingLandmarks } =
    useSystemLandmarks(profile?.school ?? "", profile?.campus ?? "")

  useEffect(() => {
    if (error) {
      toast.error("Failed to load profile data")
      console.error(error)
    }
  }, [error])

  const onSubmit = async (values: {
    preferredLandmark: string
    preferredExactLocation: string
  }) => {
    updateProfile.mutate(
      {
        preferredLandmark: values.preferredLandmark,
        preferredExactLocation: values.preferredExactLocation,
      },
      {
        onSuccess: () => {
          toast.success("Delivery preferences updated successfully")
          reset(values)
        },
        onError: (error) => {
          const err = error as AxiosError<{ error?: string }>
          toast.error(
            err.response?.data?.error || "Failed to update preferences"
          )
        },
      }
    )
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-8 rounded-3xl border border-border bg-card p-6"
    >
      {/* School & Campus Preferences */}
      <section className="space-y-6">
        <div>
          <h2 className="flex items-center gap-2 font-heading text-lg font-bold">
            <GraduationCap className="size-5 text-primary" />
            School & Campus
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your school and campus are locked to your registered account.
            Contact support if you need to change them.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-border bg-muted/40 px-4 py-3">
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              School
            </p>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">
                {profile?.school ? getSchoolName(profile.school) : "—"}
              </p>
              <Lock className="size-3.5 shrink-0 text-muted-foreground" />
            </div>
          </div>
          <div className="rounded-xl border border-border bg-muted/40 px-4 py-3">
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              Campus
            </p>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">
                {profile?.school && profile?.campus
                  ? getCampusName(profile.school, profile.campus)
                  : "—"}
              </p>
              <Lock className="size-3.5 shrink-0 text-muted-foreground" />
            </div>
          </div>
        </div>
      </section>

      <hr className="border-border" />

      {/* Delivery Preferences */}
      <section className="space-y-6">
        <div>
          <h2 className="flex items-center gap-2 font-heading text-lg font-bold">
            <MapPin className="size-5 text-primary" />
            Default Delivery Location
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            This will be pre-filled at checkout to save you time.
          </p>
        </div>
        <div className="space-y-5">
          <Controller
            name="preferredLandmark"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <label className="text-sm font-medium" htmlFor={field.name}>
                  Nearest Landmark (Delivery Zone)
                </label>
                {loadingLandmarks ? (
                  <Select disabled>
                    <SelectTrigger id={field.name}>
                      <SelectValue placeholder="Loading landmarks..." />
                    </SelectTrigger>
                  </Select>
                ) : (
                  <Select
                    key={`landmark-select-${profile?.school}-${profile?.campus}`}
                    onValueChange={field.onChange}
                    value={field.value || undefined}
                    disabled={!profile?.school || !profile?.campus}
                  >
                    <SelectTrigger id={field.name}>
                      <SelectValue
                        placeholder={
                          !profile?.school || !profile?.campus
                            ? "Campus not configured"
                            : systemLandmarks.length === 0
                              ? "No landmarks available"
                              : "Select a landmark"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {systemLandmarks.map((landmark) => (
                        <SelectGroup key={landmark.id}>
                          <SelectItem
                            value={landmark.name}
                            className="font-bold text-foreground"
                          >
                            <span className="ml-1">{landmark.name}</span>
                          </SelectItem>
                          {landmark.subLandmarks?.map((sub) => (
                            <SelectItem
                              key={sub.id}
                              value={`${landmark.name} - ${sub.name}`}
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
                )}
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="preferredExactLocation"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <label className="text-sm font-medium" htmlFor={field.name}>
                  Exact Location (Lodge Name)
                </label>
                <Input
                  {...field}
                  id={field.name}
                  placeholder="e.g. Block C, Room 4, SUG Lodge"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>
      </section>

      <div className="flex justify-end pt-4">
        <Button
          type="submit"
          variant="hero"
          disabled={!isDirty || updateProfile.isPending}
        >
          {updateProfile.isPending ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" /> Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </form>
  )
}
