"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useVendorAuth } from "@/hooks/useVendorAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { vendorLoginSchema, type VendorLoginValues } from "@/lib/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";

export default function VendorLoginPage() {
  const { login } = useVendorAuth();
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const form = useForm<VendorLoginValues>({
    // `as any` needed: @hookform/resolvers typed against Zod 4.0.x; project uses 4.4.x
    resolver: zodResolver(vendorLoginSchema as any),
    defaultValues: {
      phone: "",
      password: "",
    },
  });

  const onSubmit = (values: VendorLoginValues) => {
    setError("");
    setLoading(true);
    
    setTimeout(() => {
      const result = login(values.phone.trim(), values.password);
      if (result.ok) {
        if (values.phone.trim() === "admin") {
          router.replace("/admin");
        } else {
          router.replace("/vendor/dashboard");
        }
      } else {
        setError(result.error ?? "Login failed.");
        setLoading(false);
      }
    }, 600);
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 rounded-2xl items-center justify-center text-primary-foreground font-bold text-2xl mb-4 bg-primary shadow-lg shadow-primary/20">C</div>
          <h1 className="font-heading text-2xl font-bold">Vendor Login</h1>
          <p className="text-muted-foreground text-sm mt-1">Access your CampusBites dashboard</p>
        </div>

        <div className="rounded-3xl bg-card border border-border p-8">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Controller
              name="phone"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Phone / ID</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    placeholder="e.g. 2348012345678"
                    autoComplete="username"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                  <div className="relative">
                    <Input
                      {...field}
                      id={field.name}
                      type={showPw ? "text" : "password"}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      aria-invalid={fieldState.invalid}
                      className="pr-11"
                    />
                    <button type="button" onClick={() => setShowPw((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Button type="submit" variant="hero" size="xl" className="w-full mt-2" disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Default password: <span className="font-mono font-semibold">vendor123</span>
          </p>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          <Link href="/" className="hover:text-primary transition-colors">← Back to CampusBites</Link>
        </p>
      </div>
    </main>
  );
}
