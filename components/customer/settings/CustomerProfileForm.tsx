"use client"

import { useForm, Controller } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { formatFromWhatsapp } from "@/lib/schemas"
import { Button } from "@/components/ui/button"
import { Field, FieldError } from "@/components/ui/field"
import { toast } from "sonner"
import { useCustomerProfile } from "@/hooks/customer/useCustomerProfile"
import { useUpdateCustomerProfile } from "@/hooks/customer/useCustomerMutations"
import { Loader2, User } from "lucide-react"
import { ImageUpload } from "@/components/shared/ImageUpload"
import type { AxiosError } from "axios"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"

export function CustomerProfileForm() {
  const { data: profile, isLoading, error } = useCustomerProfile()
  const updateProfile = useUpdateCustomerProfile()
  const { update } = useSession()

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm({
    values: {
      name: profile?.name || "",
      username: profile?.username || "",
      phone: profile?.phone ? formatFromWhatsapp(profile.phone) : "",
    },
    defaultValues: {
      name: "",
      username: "",
      phone: "",
    },
  })

  const [imageUpload, setImageUpload] = useState<{
    url: string
    publicId: string
    file?: File
  } | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    if (profile?.image) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setImageUpload({
        url: profile.image,
        publicId: profile.imagePublicId || "",
      })
    }
  }, [profile?.image, profile?.imagePublicId])

  useEffect(() => {
    if (error) {
      toast.error("Failed to load profile data")
      console.error(error)
    }
  }, [error])

  const onSubmit = async (values: {
    name: string
    username: string
    phone: string
  }) => {
    let finalImageUrl = profile?.image || ""
    let finalPublicId = profile?.imagePublicId || ""

    if (imageUpload?.file) {
      setIsUploading(true)
      const formData = new FormData()
      formData.append("file", imageUpload.file)
      formData.append("type", "customer")

      try {
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })
        const uploadData = await uploadRes.json()

        if (!uploadRes.ok) throw new Error(uploadData.error || "Upload failed")

        finalImageUrl = uploadData.imageUrl
        finalPublicId = uploadData.publicId
      } catch (error: unknown) {
        const err = error as Error
        toast.error(err.message || "Failed to upload image")
        setIsUploading(false)
        return
      }
      setIsUploading(false)
    } else if (imageUpload === null) {
      finalImageUrl = ""
      finalPublicId = ""
    }

    updateProfile.mutate(
      {
        name: values.name,
        username: values.username || undefined,
        phone: values.phone,
        image: finalImageUrl,
        imagePublicId: finalPublicId,
      },
      {
        onSuccess: async () => {
          toast.success("Profile updated successfully")
          await update({ name: values.name, image: finalImageUrl })
          reset(values)
        },
        onError: (error) => {
          const err = error as AxiosError<{ error?: string }>
          toast.error(err.response?.data?.error || "Failed to update profile")
        },
      }
    )
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-8 rounded-3xl border border-border bg-card p-6"
    >
      <section className="space-y-6">
        <div>
          <h2 className="flex items-center gap-2 font-heading text-lg font-bold">
            <User className="size-5 text-primary" />
            Personal Details
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Update your basic profile information.
          </p>
        </div>

        <div className="max-w-[200px]">
          <ImageUpload
            type="customer"
            value={imageUpload}
            onChange={setImageUpload}
          />
        </div>

        <div className="space-y-5">
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
            name="username"
            control={control}
            rules={{
              minLength: {
                value: 3,
                message: "Username must be at least 3 characters",
              },
              maxLength: {
                value: 20,
                message: "Username cannot exceed 20 characters",
              },
              pattern: {
                value: /^[a-z0-9-]+$/,
                message:
                  "Username can only contain lowercase letters, numbers, and hyphens",
              },
            }}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <label className="text-sm font-medium" htmlFor={field.name}>
                  Username
                </label>
                <div className="relative">
                  <span className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground">
                    @
                  </span>
                  <Input
                    {...field}
                    id={field.name}
                    placeholder="e.g. johndoe"
                    className="pl-8"
                    aria-invalid={fieldState.invalid}
                    onChange={(e) =>
                      field.onChange(e.target.value.toLowerCase())
                    }
                  />
                </div>
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
                  placeholder="e.g. 08012345678"
                  maxLength={11}
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
          className="w-full sm:w-auto"
          disabled={
            (!isDirty &&
              imageUpload?.url === profile?.image &&
              imageUpload?.url !== undefined) ||
            updateProfile.isPending ||
            isUploading
          }
        >
          {updateProfile.isPending || isUploading ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : null}
          Save Changes
        </Button>
      </div>
    </form>
  )
}
