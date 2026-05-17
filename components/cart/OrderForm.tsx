"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, X, Minus, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/hooks/useCart";
import { orderFormInputSchema, type OrderFormInputValues } from "@/lib/schemas";
import { normaliseNigerianPhone } from "@/lib/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { toast } from "sonner";
import { formatPrice } from "@/lib/format";
import apiClient from "@/lib/axios";

interface OrderFormProps {
  open: boolean;
  onClose: () => void;
}

export function OrderForm({ open, onClose }: OrderFormProps) {
  const { cart, updateQuantity, removeItem, clearCart, total } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<OrderFormInputValues>({
    // `as any` needed: @hookform/resolvers typed against Zod 4.0.x; project uses 4.4.x
    resolver: zodResolver(orderFormInputSchema as any),
    defaultValues: {
      name: "",
      phone: "",
      location: "",
      notes: "",
    },
  });

  if (!open) return null;

  const onSubmit = async (values: OrderFormInputValues) => {
    setServerError(null);

    if (cart.items.length === 0 || !cart.vendorId) return;

    // Normalise the phone number before sending to the API
    const customerPhone = normaliseNigerianPhone(values.phone);

    setLoading(true);
    try {
      // POST to the real API — order is saved to MongoDB.
      const response = await apiClient.post("/orders", {
        vendorId: cart.vendorId,
        vendorName: cart.vendorName,
        vendorWhatsappNumber: cart.vendorWhatsappNumber || "",
        items: cart.items.map((ci) => ({
          menuItemId: ci.menuItem.id,
          name: ci.menuItem.name,
          price: ci.menuItem.price,
          quantity: ci.quantity,
        })),
        customerName: values.name,
        customerPhone,
        location: values.location,
        notes: values.notes,
        total,
      });

      const { orderId } = response.data;
      toast.success("Order placed successfully!");
      router.push(`/order/${orderId}`);
      // Note: We intentionally do NOT clear the cart here or set loading to false.
      // This keeps the UI frozen with the spinning button while Next.js redirects,
      // preventing the 0 flash. The cart will be cleared on the tracking page.
    } catch (error) {
      // API or network error
      const apiError = (error as any).response?.data?.error;
      setServerError(apiError || "Something went wrong placing your order. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full sm:max-w-lg bg-card border border-border rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between rounded-t-3xl">
          <div>
            <p className="text-xs text-muted-foreground">{cart.vendorName}</p>
            <h2 className="font-heading font-bold text-lg">Place your order</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X />
          </Button>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Cart items */}
          <div className="space-y-2">
            <p className="text-sm font-semibold">Your items</p>
            {cart.items.map((ci) => (
              <div
                key={ci.menuItem.id}
                className="flex items-center gap-3 rounded-2xl bg-muted/50 p-3"
              >
                <p className="flex-1 text-sm font-medium leading-snug">
                  {ci.menuItem.name}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => updateQuantity(ci.menuItem.id, ci.quantity - 1)}
                    className="h-6 w-6 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
                  >
                    <Minus className="size-3" />
                  </button>
                  <span className="w-5 text-center text-sm font-bold">
                    {ci.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(ci.menuItem.id, ci.quantity + 1)}
                    className="h-6 w-6 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
                  >
                    <Plus className="size-3" />
                  </button>
                </div>
                <p className="text-sm font-bold w-20 text-right">
                  {formatPrice(ci.menuItem.price * ci.quantity)}
                </p>
                <button
                  type="button"
                  onClick={() => removeItem(ci.menuItem.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
            <div className="flex justify-between pt-2 border-t border-border text-sm font-bold">
              <span>Total</span>
              <span className="text-primary">{formatPrice(total)}</span>
            </div>
          </div>

          {/* Customer info */}
          <div className="space-y-4">
            <p className="text-sm font-semibold">Your details</p>
            
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <Input
                    {...field}
                    id={field.name}
                    placeholder="Your name *"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="phone"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <Input
                    {...field}
                    id={field.name}
                    type="tel"
                    placeholder="Phone number * (e.g. 08012345678)"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="location"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <Input
                    {...field}
                    id={field.name}
                    placeholder="Delivery location * (e.g. Bella Hostel)"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="notes"
              control={form.control}
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
          </div>

          {/* Server error */}
          {serverError && (
            <p className="text-sm text-destructive text-center bg-destructive/10 rounded-xl py-2 px-4">{serverError}</p>
          )}

          <Button
            type="submit"
            variant="hero"
            size="xl"
            className="w-full"
            disabled={loading || cart.items.length === 0}
          >
            {loading ? (
              <Loader2 className="animate-spin size-4" />
            ) : (
              <ShoppingBag className="size-4" />
            )}
            {loading ? "Placing order…" : `Place order · ${formatPrice(total)}`}
          </Button>
        </form>
      </div>
    </div>
  );
}