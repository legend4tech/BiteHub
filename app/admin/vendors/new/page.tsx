"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { MENU_CATEGORIES, VENDOR_CATEGORIES, SCHOOLS, CAMPUSES } from "@/lib/constants";
import apiClient from "@/lib/axios";
import Link from "next/link";

const addVendorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  whatsappNumber: z.string().min(1, "WhatsApp number is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  tags: z.array(z.string()).min(1, "At least one tag is required"),
  school: z.string().min(1, "School is required"),
  campus: z.string().min(1, "Campus is required"),
  image: z.object({
    url: z.string().min(1, "Image is required"),
    publicId: z.string().min(1),
  }).optional().refine(val => !!val, { message: "Image is required" }),
});

type AddVendorValues = z.infer<typeof addVendorSchema>;

export default function NewVendorPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<AddVendorValues>({
    resolver: zodResolver(addVendorSchema as any),
    defaultValues: { 
      name: "", 
      whatsappNumber: "", 
      email: "", 
      password: "",
      description: "",
      category: "meals",
      tags: [],
      school: "COOU",
      campus: "Uli"
    },
  });

  const onSubmit = async (values: AddVendorValues) => {
    setSubmitting(true);
    try {
      let formattedWhatsappNumber = values.whatsappNumber.trim();
      if (formattedWhatsappNumber.startsWith("0")) {
        formattedWhatsappNumber = "234" + formattedWhatsappNumber.slice(1);
      }
      
      await apiClient.post("/admin/vendors", {
        ...values,
        whatsappNumber: formattedWhatsappNumber,
      });
      toast.success(`Vendor ${values.name} created successfully`);
      router.push("/admin");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to create vendor");
    } finally {
      setSubmitting(false);
    }
  };

  const categories = MENU_CATEGORIES.filter(c => c.value !== "all");

  return (
    <div className="container max-w-2xl mx-auto py-10 px-4">
      <div className="mb-8">
        <Button variant="ghost" asChild className="-ml-2 text-muted-foreground">
          <Link href="/admin">
            <ArrowLeft className="size-4 mr-2" /> Back to Admin
          </Link>
        </Button>
        <h1 className="font-heading font-bold text-3xl mt-4">Add New Vendor</h1>
        <p className="text-muted-foreground mt-1">Create a vendor profile and login account</p>
      </div>

      <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Controller name="name" control={form.control} render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Vendor Name *</FieldLabel>
              <Input {...field} id={field.name} placeholder="e.g. Mama Put" aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )} />

          <div className="grid grid-cols-2 gap-4">
            <Controller name="whatsappNumber" control={form.control} render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>WhatsApp Number *</FieldLabel>
                <Input {...field} id={field.name} placeholder="e.g. 2348012345678" aria-invalid={fieldState.invalid} />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )} />

            <Controller name="category" control={form.control} render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Category *</FieldLabel>
                <Select
                  name={field.name}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger id={field.name} aria-invalid={fieldState.invalid} className="w-full h-11 rounded-xl">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {VENDOR_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )} />
          </div>

          <Controller name="description" control={form.control} render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Description *</FieldLabel>
              <Textarea {...field} id={field.name} placeholder="Tell us about the vendor..." aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )} />

          <div className="grid grid-cols-2 gap-4">
            <Controller name="school" control={form.control} render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>School *</FieldLabel>
                <Select
                  name={field.name}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger id={field.name} aria-invalid={fieldState.invalid} className="w-full h-11 rounded-xl">
                    <SelectValue placeholder="Select school" />
                  </SelectTrigger>
                  <SelectContent>
                    {SCHOOLS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )} />

            <Controller name="campus" control={form.control} render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Campus *</FieldLabel>
                <Select
                  name={field.name}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger id={field.name} aria-invalid={fieldState.invalid} className="w-full h-11 rounded-xl">
                    <SelectValue placeholder="Select campus" />
                  </SelectTrigger>
                  <SelectContent>
                    {CAMPUSES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )} />
          </div>

          <Controller name="tags" control={form.control} render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Tags (Select applicable) *</FieldLabel>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {categories.map((c) => (
                  <div key={c.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`tag-${c.value}`}
                      checked={field.value?.includes(c.value)}
                      onCheckedChange={(checked) => {
                        const current = field.value || [];
                        const updated = checked
                          ? [...current, c.value]
                          : current.filter((v: string) => v !== c.value);
                        field.onChange(updated);
                      }}
                    />
                    <label
                      htmlFor={`tag-${c.value}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {c.label}
                    </label>
                  </div>
                ))}
              </div>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )} />

          <div className="border-t border-border pt-6 mt-6">
            <h3 className="font-heading font-semibold text-lg mb-4">Account Credentials</h3>
            
            <Controller name="email" control={form.control} render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Email *</FieldLabel>
                <Input {...field} id={field.name} type="email" placeholder="vendor@email.com" aria-invalid={fieldState.invalid} />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )} />

            <Controller name="password" control={form.control} render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="mt-4">
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
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )} />
          </div>

          <div className="border-t border-border pt-6 mt-6">
            <Controller name="image" control={form.control} render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Profile Image *</FieldLabel>
                <ImageUpload
                  value={field.value}
                  onChange={field.onChange}
                  type="vendor"
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )} />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" asChild>
              <Link href="/admin">Cancel</Link>
            </Button>
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
