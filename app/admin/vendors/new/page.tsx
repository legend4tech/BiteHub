"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import apiClient from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldLabel, FieldError, FieldDescription } from "@/components/ui/field";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// ─── Schema ───────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: "food", label: "Food" },
  { value: "snacks", label: "Snacks" },
  { value: "drinks", label: "Drinks" },
  { value: "healthy", label: "Healthy" },
  { value: "grills", label: "Grills" },
  { value: "shawarma", label: "Shawarma" },
  { value: "general", label: "General" },
];

const schema = z.object({
  // Vendor profile fields
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  description: z.string().trim().optional(),
  category: z.string().min(1, "Category is required"),
  tags: z.string().trim().optional(), // comma-separated, parsed before submit
  whatsappNumber: z
    .string()
    .trim()
    .length(11, "WhatsApp number must be exactly 11 digits (e.g., 08012345678)")
    .regex(/^0\d{10}$/, "Must start with 0 and contain only numbers"),
  school: z.string().trim().optional(),
  campus: z.string().trim().optional(),
  isActive: z.boolean().default(true),
  // Login account fields
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormValues = z.infer<typeof schema>;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewVendorPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    // `as any` needed: @hookform/resolvers typed against Zod 4.0.x; project uses 4.4.x
    resolver: zodResolver(schema as any),
    defaultValues: {
      name: "",
      description: "",
      category: "general",
      tags: "",
      whatsappNumber: "",
      school: "COOU",
      campus: "Uli",
      isActive: true,
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const tagsArray = values.tags
        ? values.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [];

      // Format WhatsApp number (e.g., 08012345678 -> 2348012345678)
      const formattedPhone = "234" + values.whatsappNumber.substring(1);

      await apiClient.post("/admin/vendors", {
        name: values.name,
        description: values.description,
        category: values.category,
        tags: tagsArray,
        whatsappNumber: formattedPhone,
        school: values.school || "COOU",
        campus: values.campus || "Uli",
        isActive: values.isActive,
        email: values.email,
        password: values.password,
      });

      toast.success("Vendor created successfully!");
      router.push("/admin");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to create vendor");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center gap-4">
          <Link href="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <p className="text-xs text-muted-foreground leading-none">Admin</p>
            <p className="font-heading font-bold text-sm leading-tight">Create New Vendor</p>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

          {/* ── Vendor Profile ── */}
          <section className="rounded-3xl border border-border bg-card p-6 space-y-5">
            <div className="pb-2 border-b border-border">
              <h2 className="font-heading font-bold text-base">Vendor Profile</h2>
              <p className="text-xs text-muted-foreground mt-0.5">This is the public-facing vendor information</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Controller name="name" control={form.control} render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="sm:col-span-2">
                  <FieldLabel htmlFor={field.name}>Vendor Name *</FieldLabel>
                  <Input {...field} id={field.name} placeholder="e.g. Mama Nkechi's Kitchen" aria-invalid={fieldState.invalid} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )} />

              <Controller name="category" control={form.control} render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Category *</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange} name={field.name}>
                    <SelectTrigger id={field.name} className="h-11 rounded-xl w-full" aria-invalid={fieldState.invalid}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )} />

              <Controller name="whatsappNumber" control={form.control} render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>WhatsApp Number *</FieldLabel>
                  <Input {...field} id={field.name} placeholder="08012345678" aria-invalid={fieldState.invalid} />
                  <FieldDescription>Must be exactly 11 digits starting with 0</FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )} />

              <Controller name="campus" control={form.control} render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Campus</FieldLabel>
                  <Input {...field} id={field.name} placeholder="Uli" aria-invalid={fieldState.invalid} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )} />

              <Controller name="school" control={form.control} render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>School</FieldLabel>
                  <Input {...field} id={field.name} placeholder="COOU" aria-invalid={fieldState.invalid} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )} />

              <Controller name="description" control={form.control} render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="sm:col-span-2">
                  <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                  <Textarea {...field} id={field.name} placeholder="Brief description of the vendor and their food..." rows={3} className="resize-none" aria-invalid={fieldState.invalid} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )} />

              <Controller name="tags" control={form.control} render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="sm:col-span-2">
                  <FieldLabel htmlFor={field.name}>Tags</FieldLabel>
                  <Input {...field} id={field.name} placeholder="rice, soup, swallow" aria-invalid={fieldState.invalid} />
                  <FieldDescription>Comma-separated. Used for search filtering (e.g. rice, soup, swallow)</FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )} />

              <Controller name="isActive" control={form.control} render={({ field }) => (
                <Field orientation="horizontal" className="sm:col-span-2 py-1">
                  <Switch id={field.name} checked={field.value} onCheckedChange={field.onChange} />
                  <div>
                    <FieldLabel htmlFor={field.name} className="cursor-pointer">Active storefront</FieldLabel>
                    <p className="text-xs text-muted-foreground">When off, vendor is hidden from the public listing</p>
                  </div>
                </Field>
              )} />
            </div>
          </section>

          {/* ── Login Account ── */}
          <section className="rounded-3xl border border-border bg-card p-6 space-y-5">
            <div className="pb-2 border-b border-border">
              <h2 className="font-heading font-bold text-base">Login Account</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Credentials the vendor uses to access their dashboard</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
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
                    <Input
                      {...field}
                      id={field.name}
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 6 characters"
                      aria-invalid={fieldState.invalid}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  <FieldDescription>Min. 6 characters.</FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )} />
            </div>
          </section>

          {/* Submit */}
          <div className="flex gap-3 pb-8">
            <Button type="button" variant="outline" className="flex-1" asChild>
              <Link href="/admin">Cancel</Link>
            </Button>
            <Button type="submit" variant="hero" className="flex-1" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Create vendor
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
