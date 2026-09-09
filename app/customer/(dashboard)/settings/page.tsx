"use client"

import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Field, FieldError } from "@/components/ui/field"
import { toast } from "sonner"
import { useCustomerProfile } from "@/hooks/customer/useCustomerProfile"
import { useUpdateCustomerProfile } from "@/hooks/customer/useCustomerMutations"
import { Loader2, User, MapPin, GraduationCap } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getSchoolOptions, getCampusOptions } from "@/lib/config/campus"
import { useCart } from "@/hooks/useCart"
import { useSystemLandmarks } from "@/hooks/shared/useLandmarks"

export default function CustomerSettingsPage() {
  const { data: profile, isLoading, error } = useCustomerProfile()
  const updateProfile = useUpdateCustomerProfile()
  const { clearCart } = useCart()

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { isDirty },
  } = useForm({
    defaultValues: {
      name: "",
      phone: "",
      school: "",
      campus: "",
      preferredLandmark: "",
      preferredExactLocation: "",
    },
  })

  const currentSchool = watch("school")
  const currentCampus = watch("campus")
  const { data: systemLandmarks = [], isLoading: loadingLandmarks } =
    useSystemLandmarks(currentSchool, currentCampus)

  useEffect(() => {
    if (profile) {
      reset({
        name: profile.name || "",
        phone: profile.phone || "",
        school: profile.school || "",
        campus: profile.campus || "",
        preferredLandmark:
          profile.preferredLocation || profile.preferredLandmark || "",
        preferredExactLocation: profile.preferredExactLocation || "",
      })
    }
  }, [profile, reset])

  useEffect(() => {
    if (error) {
      toast.error("Failed to load profile data")
      console.error(error)
    }
  }, [error])

  const onSubmit = async (values: {
    name: string
    phone: string
    school: string
    campus: string
    preferredLandmark: string
    preferredExactLocation: string
  }) => {
    // If campus or school changed, clear the cart to prevent checkout bugs
    const locationChanged =
      profile &&
      (profile.school !== values.school || profile.campus !== values.campus)

    updateProfile.mutate(
      {
        name: values.name,
        phone: values.phone,
        school: values.school,
        campus: values.campus,
        preferredLocation: values.preferredLandmark, // Using preferredLocation for display compatibility
        preferredLandmark: values.preferredLandmark,
        preferredExactLocation: values.preferredExactLocation,
      },
      {
        onSuccess: () => {
          if (locationChanged) {
            clearCart()
            toast.success("Profile updated and cart cleared due to campus change.")
          } else {
            toast.success("Profile updated successfully")
          }
          reset(values) // Reset to new values to clear isDirty state
        },
        onError: (error) => {
          const err = error as import("axios").AxiosError<{ error?: string }>
          toast.error(err.response?.data?.error || "Failed to update profile")
        },
      }
    )
  }

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account details and delivery preferences.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Personal Details */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex items-center gap-3 border-b border-border bg-muted/30 px-6 py-4">
            <User className="size-5 text-primary" />
            <h2 className="font-semibold">Personal Details</h2>
          </div>
          <div className="space-y-4 p-6">
            <Controller
              name="name"
              control={control}
              rules={{ required: "Name is required" }}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <label className="text-sm font-medium" htmlFor={field.name}>
                    Full Name
                  </label>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="phone"
              control={control}
              rules={{ required: "Phone number is required" }}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <label className="text-sm font-medium" htmlFor={field.name}>
                    Phone Number
                  </label>
                  <Input
                    {...field}
                    id={field.name}
                    type="tel"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </div>
        </div>

        {/* School & Campus Preferences */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex items-center gap-3 border-b border-border bg-muted/30 px-6 py-4">
            <GraduationCap className="size-5 text-primary" />
            <h2 className="font-semibold">School & Campus</h2>
          </div>
          <div className="space-y-4 p-6">
            <p className="text-sm text-muted-foreground mb-2">
              Note: Changing your school or campus will automatically clear your current cart.
            </p>
            <Controller
              name="school"
              control={control}
              rules={{ required: "School is required" }}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <label className="text-sm font-medium" htmlFor={field.name}>
                    School
                  </label>
                  <Select
                    onValueChange={(val) => {
                      field.onChange(val)
                      setValue("campus", "", { shouldDirty: true })
                      setValue("preferredLandmark", "", { shouldDirty: true })
                      setValue("preferredExactLocation", "", { shouldDirty: true })
                      toast.info("Please reconfigure your Default Delivery Location")
                    }}
                    value={field.value}
                  >
                    <SelectTrigger id={field.name}>
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
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="campus"
              control={control}
              rules={{ required: "Campus is required" }}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <label className="text-sm font-medium" htmlFor={field.name}>
                    Campus
                  </label>
                  <Select
                    onValueChange={(val) => {
                      field.onChange(val)
                      setValue("preferredLandmark", "", { shouldDirty: true })
                      setValue("preferredExactLocation", "", { shouldDirty: true })
                      toast.info("Please reconfigure your Default Delivery Location")
                    }}
                    value={field.value}
                    disabled={!currentSchool}
                  >
                    <SelectTrigger id={field.name}>
                      <SelectValue placeholder="Select your campus" />
                    </SelectTrigger>
                    <SelectContent>
                      {getCampusOptions(control._formValues.school).map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </div>
        </div>

        {/* Delivery Preferences */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex items-center gap-3 border-b border-border bg-muted/30 px-6 py-4">
            <MapPin className="size-5 text-primary" />
            <h2 className="font-semibold">Default Delivery Location</h2>
          </div>
          <div className="space-y-4 p-6">
            <Controller
              name="preferredLandmark"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <label className="text-sm font-medium" htmlFor={field.name}>
                    Nearest Landmark (Delivery Zone)
                  </label>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!currentSchool || !currentCampus || loadingLandmarks}
                  >
                    <SelectTrigger id={field.name}>
                      <SelectValue
                        placeholder={
                          loadingLandmarks
                            ? "Loading landmarks..."
                            : !currentSchool || !currentCampus
                              ? "Select school and campus first"
                              : systemLandmarks.length === 0
                                ? "No landmarks available"
                                : "Select a landmark"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {systemLandmarks.map((landmark) => (
                        <SelectItem key={landmark.id} value={landmark.name}>
                          {landmark.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    This will be pre-filled at checkout.
                  </p>
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
        </div>

        <div className="flex justify-end">
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
    </div>
  )
}
