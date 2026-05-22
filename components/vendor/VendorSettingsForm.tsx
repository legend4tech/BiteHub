"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { toast } from "sonner";
import type { Vendor } from "@/lib/types";
import apiClient from "@/lib/axios";
import { useRouter } from "next/navigation";
import {
  vendorSettingsSchema,
  type VendorSettingsValues,
  formatFromWhatsapp,
} from "@/lib/schemas";
import { useSession } from "next-auth/react";
import { VENDOR_CATEGORIES, MENU_CATEGORIES } from "@/lib/constants";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface VendorSettingsFormProps {
  initial: Vendor;
}

export function VendorSettingsForm({ initial }: VendorSettingsFormProps) {
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { update } = useSession();

  const form = useForm<VendorSettingsValues>({
    resolver: async (data) => {
      const result = vendorSettingsSchema.safeParse(data);
      if (result.success) {
        return { values: result.data, errors: {} };
      } else {
        const errors = result.error.flatten().fieldErrors as Record<string, string[] | undefined>;
        const formattedErrors: Record<string, any> = {};
        for (const key in errors) {
          formattedErrors[key] = { message: errors[key]?.[0] };
        }
        return { values: {}, errors: formattedErrors };
      }
    },
    defaultValues: {
      name: initial.name ?? "",
      description: initial.description ?? "",
      whatsappNumber: formatFromWhatsapp(initial.whatsappNumber ?? ""),
      category: initial.category ?? "",
      tags: initial.tags ?? [],
      image: typeof initial.image === "string" ? undefined : initial.image,
    },
  });

  const onSubmit = async (values: VendorSettingsValues) => {
    setSaving(true);
    try {
      let imageToSave = values.image;

      if (values.image && typeof values.image === "object" && "file" in values.image && values.image.file) {
        const formData = new FormData();
        formData.append("file", values.image.file);
        formData.append("type", "vendor");

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          const errData = await uploadResponse.json();
          throw new Error(errData.error || "Failed to upload image");
        }

        const uploadData = await uploadResponse.json();
        imageToSave = {
          url: uploadData.imageUrl,
          publicId: uploadData.publicId,
        };
      }

      const response = await apiClient.patch("/vendor/settings", {
        name: values.name,
        description: values.description,
        whatsappNumber: values.whatsappNumber,
        category: values.category,
        tags: values.tags,
        image: imageToSave,
      });

      const updatedVendor = response.data;
      const initialImageUrl = typeof initial.image === "string" ? initial.image : initial.image?.url;
      const updatedImageUrl = updatedVendor.image?.url || null;

      const nameChanged = values.name !== initial.name;
      const imageChanged = updatedImageUrl !== (initialImageUrl || null);

      if (nameChanged || imageChanged) {
        await update({
          name: values.name,
          image: updatedImageUrl,
        });
      }

      toast.success("Settings updated successfully");
      router.refresh();
    } catch (error: any) {
      console.error("Save settings error:", error);
      toast.error(error.message || "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Field>
        <label className="text-sm font-medium" htmlFor="name">
          Vendor Name
        </label>
        <Input
          {...form.register("name")}
          id="name"
          placeholder="e.g. Mama Put"
        />
      </Field>

      <Field>
        <label className="text-sm font-medium" htmlFor="description">
          Description
        </label>
        <Textarea
          {...form.register("description")}
          id="description"
          placeholder="Tell customers about your kitchen..."
          rows={4}
        />
      </Field>

      <Field>
        <label className="text-sm font-medium" htmlFor="whatsappNumber">
          WhatsApp Number
        </label>
        <Input
          {...form.register("whatsappNumber")}
          id="whatsappNumber"
          placeholder="e.g. 08012345678"
        />
      </Field>

      <Controller name="category" control={form.control} render={({ field }) => (
        <Field>
          <label className="text-sm font-medium" htmlFor="category">Category</label>
          <Select
            name={field.name}
            value={field.value}
            onValueChange={field.onChange}
          >
            <SelectTrigger id="category" className="w-full h-11 rounded-xl">
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
        </Field>
      )} />

      <Controller name="tags" control={form.control} render={({ field }) => (
        <Field>
          <label className="text-sm font-medium">Tags (Select applicable)</label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {MENU_CATEGORIES.filter(c => c.value !== "all").map((c) => (
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
        </Field>
      )} />

      <Field>
        <label className="text-sm font-medium">Store Image</label>
        <Controller
          control={form.control}
          name="image"
          render={({ field }) => (
            <ImageUpload
              value={field.value}
              onChange={field.onChange}
              type="vendor"
            />
          )}
        />
      </Field>

      <div className="flex justify-end">
        <Button type="submit" variant="hero" disabled={saving}>
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </form>
  );
}
