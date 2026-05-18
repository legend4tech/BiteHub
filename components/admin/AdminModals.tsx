"use client";

import { useState } from "react";
import { Loader2, X, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { toast } from "sonner";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import apiClient from "@/lib/axios";
import type { AdminVendor } from "./types";

// ─── Add Login Modal ──────────────────────────────────────────────────────────

const addLoginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type AddLoginValues = z.infer<typeof addLoginSchema>;

export function AddLoginModal({
  vendor, onClose, onSuccess,
}: {
  vendor: AdminVendor; onClose: () => void; onSuccess: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<AddLoginValues>({
    resolver: zodResolver(addLoginSchema as any),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: AddLoginValues) => {
    setSubmitting(true);
    try {
      await apiClient.post(`/admin/vendors/${vendor.id}/account`, values);
      toast.success(`Login account created for ${vendor.name}`);
      onSuccess();
      onClose();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="font-heading font-bold text-lg">Create Login Account</h2>
            <p className="text-xs text-muted-foreground mt-0.5">For <span className="font-semibold text-foreground">{vendor.name}</span></p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="-mt-1 -mr-1"><X className="size-4" /></Button>
        </div>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Controller name="email" control={form.control} render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Email *</FieldLabel>
              <Input {...field} id={field.name} type="email" placeholder="vendor@email.com" aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )} />
          <Controller name="password" control={form.control} render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Password *</FieldLabel>
              <div className="relative">
                <Input {...field} id={field.name} type={showPassword ? "text" : "password"} placeholder="Min. 6 characters" aria-invalid={fieldState.invalid} className="pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )} />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="hero" className="flex-1" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Create login
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Add Vendor Modal ─────────────────────────────────────────────────────────

const addVendorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  whatsappNumber: z.string().min(1, "WhatsApp number is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  image: z.object({ url: z.string().min(1), publicId: z.string().min(1) })
    .optional().refine(val => !!val, { message: "Image is required" }),
});
type AddVendorValues = z.infer<typeof addVendorSchema>;

export function AddVendorModal({
  onClose, onSuccess,
}: {
  onClose: () => void; onSuccess: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<AddVendorValues>({
    resolver: zodResolver(addVendorSchema as any),
    defaultValues: { name: "", whatsappNumber: "", email: "", password: "" },
  });

  const onSubmit = async (values: AddVendorValues) => {
    setSubmitting(true);
    try {
      let wa = values.whatsappNumber.trim();
      if (wa.startsWith("0")) wa = "234" + wa.slice(1);
      await apiClient.post("/admin/vendors", { ...values, whatsappNumber: wa });
      toast.success(`Vendor ${values.name} created successfully`);
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to create vendor");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="font-heading font-bold text-lg">Add New Vendor</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Create a vendor profile and login account</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="-mt-1 -mr-1"><X className="size-4" /></Button>
        </div>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Controller name="name" control={form.control} render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Vendor Name *</FieldLabel>
              <Input {...field} id={field.name} placeholder="e.g. Mama Put" aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )} />
          <Controller name="whatsappNumber" control={form.control} render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>WhatsApp Number *</FieldLabel>
              <Input {...field} id={field.name} placeholder="e.g. 08012345678" aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )} />
          <Controller name="email" control={form.control} render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Email *</FieldLabel>
              <Input {...field} id={field.name} type="email" placeholder="vendor@email.com" aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )} />
          <Controller name="password" control={form.control} render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Password *</FieldLabel>
              <div className="relative">
                <Input {...field} id={field.name} type={showPassword ? "text" : "password"} placeholder="Min. 6 characters" aria-invalid={fieldState.invalid} className="pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )} />
          <Controller name="image" control={form.control} render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Profile Image</FieldLabel>
              <ImageUpload value={field.value} onChange={field.onChange} type="vendor" />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )} />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="hero" className="flex-1" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Create Vendor
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
