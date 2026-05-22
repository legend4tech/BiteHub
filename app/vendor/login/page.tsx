"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Eye, EyeOff, ArrowLeft, UtensilsCrossed, ShoppingBag, Star, TrendingUp } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { AuthPanel } from "@/components/shared/AuthPanel";
import { toast } from "sonner";
import { APP_NAME, APP_LOGO_URL } from "@/lib/constants";


const vendorLoginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
type VendorLoginValues = z.infer<typeof vendorLoginSchema>;

const features = [
  { icon: ShoppingBag, text: "Manage orders in real-time" },
  { icon: UtensilsCrossed, text: "Build and update your menu easily" },
  { icon: TrendingUp, text: "Track sales and performance" },
  { icon: Star, text: "Reach hundreds of students daily" },
];

export default function VendorLoginPage() {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);


  const form = useForm<VendorLoginValues>({
    resolver: zodResolver(vendorLoginSchema as any),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: VendorLoginValues) => {
    if (typeof window !== "undefined" && !navigator.onLine) {
      toast.error("You are offline. Please check your internet connection.");
      return;
    }

    setLoading(true);
    try {
      const res = await signIn("vendor-login", {
        redirect: false,
        email: values.email.trim(),
        password: values.password,
      });

      if (res?.error) {
        if (res.error.includes("Too Many Requests")) {
          // Rate limit message — pass through as-is (already user-friendly)
          toast.error(res.error);
        } else if (res.error === "Configuration" || res.error === "AccessDenied") {
          toast.error("Authentication service error. Please try again.");
        } else if (res.error === "CredentialsSignin" || res.error === "Invalid credentials") {
          // NextAuth may return the raw class name in some edge cases
          toast.error("Invalid email or password.");
        } else {
          toast.error(res.error || "Something went wrong. Please try again.");
        }
      } else if (res?.url && res.url.includes("/api/auth/error")) {
        // NextAuth returned an error URL instead of an error message
        toast.error("An unexpected authentication error occurred. Please try again.");
      } else {
        toast.success("Login successful. Welcome back!");
        router.replace("/vendor/dashboard");
      }
    } catch (error: any) {
      if (error?.message?.toLowerCase().includes("fetch") || !navigator.onLine) {
        toast.error("Network error. Please check your internet connection.");
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex bg-background">

      <AuthPanel
        variant="vendor"
        bgImage="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=2000&auto=format&fit=crop"
        badge="Vendor Dashboard"
        headline="Grow your Edibles<br/>business on campus"
        subline="Join the platform that connects your kitchen with hundreds of students every day."
        features={[
          { icon: ShoppingBag, text: "Manage orders in real-time" },
          { icon: UtensilsCrossed, text: "Build and update your menu easily" },
          { icon: TrendingUp, text: "Track sales and performance" },
          { icon: Star, text: "Reach hundreds of students daily" },
        ]}
        footerText="Empowering Campus Food Businesses"
      />

      {/* ── Right panel (form) ── */}
      <div className="flex-1 flex flex-col min-h-screen">

        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-5 shrink-0">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group">
            <ArrowLeft className="size-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to {APP_NAME}
          </Link>
          {/* Mobile brand */}
          <div className="lg:hidden flex items-center gap-2.5">
            <img 
              src={APP_LOGO_URL} 
              alt={APP_NAME} 
              className="h-9 w-auto object-contain rounded-lg" 
            />
            <span className="font-heading font-black text-2xl tracking-tight text-foreground leading-none">
              Bite<span className="text-primary">Hub</span>
            </span>
          </div>
        </div>

        {/* Form centred */}
        <div className="flex-1 flex items-center justify-center px-6 py-8">
          <div className="w-full max-w-[400px]">

            {/* Heading */}
            <div className="mb-8">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 grid place-items-center mb-5">
                <UtensilsCrossed className="size-6 text-primary" />
              </div>
              <h1 className="font-heading text-3xl font-bold tracking-tight">Welcome back</h1>
              <p className="text-muted-foreground mt-1.5 text-sm">Sign in to your vendor dashboard</p>
            </div>



            {/* Form */}
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <Controller name="email" control={form.control} render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Email Address</FieldLabel>
                  <Input {...field} id={field.name} type="email" placeholder="vendor@example.com" autoComplete="username" aria-invalid={fieldState.invalid} className="h-11" />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )} />

              <Controller name="password" control={form.control} render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <div className="flex items-center justify-between">
                    <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                    <Link
                      href={`/vendor/forgot-password?email=${encodeURIComponent(form.getValues("email") || "")}`}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input {...field} id={field.name} type={showPw ? "text" : "password"} placeholder="••••••••" autoComplete="current-password" aria-invalid={fieldState.invalid} className="h-11 pr-11" />
                    <button type="button" onClick={() => setShowPw((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )} />

              <Button type="submit" variant="hero" className="w-full h-11 text-base mt-2" disabled={loading}>
                {loading && <Loader2 className="size-4 animate-spin" />}
                {loading ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
