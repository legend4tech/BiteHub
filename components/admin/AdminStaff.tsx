"use client"

import { useState } from "react"
import { useForm, useWatch, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import { Shield, Plus, Loader2, Users, Eye, EyeOff } from "lucide-react"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldError } from "@/components/ui/field"
import { Skeleton } from "@/components/ui/skeleton"
import { PasswordStrengthMeter } from "@/components/shared/PasswordStrengthMeter"
import { useAdminCreateStaff } from "@/hooks/mutations/useAdminMutations"
import { useAdminStaff } from "@/hooks/queries/useAdminStaff"
import { FetchError } from "@/components/shared/FetchError"
import { EmptyState } from "@/components/shared/EmptyState"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const createStaffSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["vendor_manager", "admin"]),
})

type CreateStaffValues = z.infer<typeof createStaffSchema>

export function AdminStaff() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const queryClient = useQueryClient()

  const {
    data: staffList,
    isLoading: loadingStaff,
    isError,
    refetch,
  } = useAdminStaff()

  const createStaffMutation = useAdminCreateStaff()

  const form = useForm<CreateStaffValues>({
    resolver: zodResolver(
      createStaffSchema as never
    ) as unknown as Resolver<CreateStaffValues>,
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "vendor_manager",
    },
  })

  const passwordValue =
    useWatch({ control: form.control, name: "password" }) ?? ""

  const onSubmit = (values: CreateStaffValues) => {
    createStaffMutation.mutate(values, {
      onSuccess: () => {
        toast.success("Staff account created successfully")
        queryClient.invalidateQueries({ queryKey: ["admin-staff"] })
        setIsCreateOpen(false)
        form.reset()
      },
      onError: (error: unknown) => {
        const err = error as { response?: { data?: { error?: string } } }
        toast.error(err.response?.data?.error || "Failed to create staff")
      },
    })
  }

  // ── Global error fallback ──────────────────────────────────────────────────
  if (isError) {
    return (
      <FetchError title="Couldn't load staff list" onRetry={() => refetch()} />
    )
  }

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Staff Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage admin and vendor manager accounts.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <Plus className="size-4" /> Add Staff
        </Button>
      </div>

      {/* ── Staff list card ── */}
      <div className="overflow-hidden rounded-3xl border border-border bg-card">
        <div className="border-b border-border bg-muted/20 px-6 py-4">
          <h2 className="flex items-center gap-2 font-heading text-lg font-bold">
            <Users className="size-5" /> Current Staff Members
          </h2>
        </div>

        {loadingStaff ? (
          // ── Skeleton rows — same shape as the real rows ──
          <div className="divide-y divide-border">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-6 py-4"
              >
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
            ))}
          </div>
        ) : staffList && staffList.length > 0 ? (
          // ── Populated list ──
          <div className="divide-y divide-border">
            {staffList.map((staff) => (
              <div
                key={staff._id}
                className="flex items-center justify-between px-6 py-4 hover:bg-muted/30"
              >
                <div>
                  <p className="font-bold">{staff.name}</p>
                  <p className="text-sm text-muted-foreground">{staff.email}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-[10px] font-bold tracking-wider uppercase ${
                    staff.role === "admin"
                      ? "bg-primary/20 text-primary"
                      : "bg-status-pending/20 text-status-pending-foreground"
                  }`}
                >
                  {staff.role.replace("_", " ")}
                </span>
              </div>
            ))}
          </div>
        ) : (
          // ── Global empty state ──
          <EmptyState
            title="No staff accounts yet"
            description="Add your first admin or vendor manager to get started."
            icon={<Users className="size-10 text-muted-foreground" />}
            showImage={false}
            size="sm"
            action={{
              label: "Add Staff",
              onClick: () => setIsCreateOpen(true),
              icon: <Plus className="size-4" />,
            }}
          />
        )}
      </div>

      {/* ── Create Staff Dialog ── */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="size-5 text-primary" />
              Create Staff Account
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="mt-4 space-y-4"
          >
            <Field>
              <div className="flex justify-between">
                <label className="text-sm font-medium">Name</label>
                <FieldError errors={[form.formState.errors.name]} />
              </div>
              <Input placeholder="John Doe" {...form.register("name")} />
            </Field>

            <Field>
              <div className="flex justify-between">
                <label className="text-sm font-medium">Email Address</label>
                <FieldError errors={[form.formState.errors.email]} />
              </div>
              <Input
                type="email"
                placeholder="john@bitehub.com"
                {...form.register("email")}
              />
            </Field>

            <Field>
              <div className="flex justify-between">
                <label className="text-sm font-medium">Role</label>
                <FieldError errors={[form.formState.errors.role]} />
              </div>
              <select
                className="flex h-10 w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                {...form.register("role")}
              >
                <option value="vendor_manager">Vendor Manager</option>
                <option value="admin">Admin</option>
              </select>
            </Field>

            <Field>
              <div className="flex justify-between">
                <label className="text-sm font-medium">
                  Temporary Password
                </label>
                <FieldError errors={[form.formState.errors.password]} />
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 chars, uppercase, number, symbol"
                  className="pr-10"
                  {...form.register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
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
              <PasswordStrengthMeter password={passwordValue} />
            </Field>

            <Button
              type="submit"
              className="mt-4 w-full"
              disabled={createStaffMutation.isPending}
            >
              {createStaffMutation.isPending && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              Create Account
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
