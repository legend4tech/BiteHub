"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Eye, EyeOff, ShieldCheck, ArrowLeft, Lock, Users, BarChart3, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { toast } from "sonner";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { AuthPanel } from "@/components/shared/AuthPanel";
import { APP_NAME, APP_LOGO_URL } from "@/lib/constants";


const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
type LoginValues = z.infer<typeof loginSchema>;

const features = [
  { icon: Users, text: "Manage all vendor accounts" },
  { icon: BarChart3, text: "Platform-wide analytics & revenue" },
  { icon: Settings, text: "Full control over the platform" },
  { icon: ShieldCheck, text: "Secure, role-based access" },
];

export default function AdminLoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema as any),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginValues) => {
    if (typeof window !== "undefined" && !navigator.onLine) {
      toast.error("You are offline. Please check your internet connection.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: values.email,
        password: values.password,
        loginType: "admin",
      });

      if (res?.error) {
        if (res.error.includes("Too Many Requests")) {
          toast.error(res.error);
        } else if (res.error === "Configuration" || res.error === "AccessDenied") {
          toast.error("Authentication service error. Please try again.");
        } else {
          toast.error(res.error.replace("CredentialsSignin: ", "") || "Invalid email or password");
        }
      } else if (res?.url && res.url.includes("/api/auth/error")) {
        toast.error("An unexpected authentication error occurred. Please try again.");
      } else {
        toast.success("Welcome back, Admin!");
        router.push("/admin");
        router.refresh();
      }
    } catch (error: any) {
      if (error?.message?.toLowerCase().includes("fetch") || !navigator.onLine) {
        toast.error("Network error. Please check your internet connection.");
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex bg-background">

      <AuthPanel
        variant="admin"
        bgImage="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2000&auto=format&fit=crop"
        badge="Admin Access Only"
        badgeIcon={Lock}
        headline="Platform control<br />centre"
        subline={`Manage vendors, monitor orders, and keep the ${APP_NAME} platform running smoothly.`}
        features={[
          { icon: Users, text: "Manage all vendor accounts" },
          { icon: BarChart3, text: "Platform-wide analytics & revenue" },
          { icon: Settings, text: "Full control over the platform" },
          { icon: ShieldCheck, text: "Secure, role-based access" },
        ]}
        footerText="Restricted access · Authorized personnel only"
        footerIcon={ShieldCheck}
      />

      {/* ── Right panel (form) ── */}
      <div className="flex-1 flex flex-col min-h-screen">

        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-5 shrink-0">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group">
            <ArrowLeft className="size-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Home
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
                <ShieldCheck className="size-6 text-primary" />
              </div>
              <h1 className="font-heading text-3xl font-bold tracking-tight">Admin Dashboard</h1>
              <p className="text-muted-foreground mt-1.5 text-sm">Sign in to manage the platform</p>
            </div>

            {/* Form */}
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <Controller name="email" control={form.control} render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Email Address</FieldLabel>
                  <Input {...field} id={field.name} type="email" placeholder="admin@bitehubapp.com" autoComplete="email" aria-invalid={fieldState.invalid} className="h-11" />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )} />

              <Controller name="password" control={form.control} render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                  <div className="relative">
                    <Input {...field} id={field.name} type={showPassword ? "text" : "password"} placeholder="Enter your password" autoComplete="current-password" aria-invalid={fieldState.invalid} className="h-11 pr-11" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1">
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )} />

              <Button type="submit" variant="hero" className="w-full h-11 text-base mt-2" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Authenticating…
                  </>
                ) : "Sign In"}
              </Button>
            </form>

            <p className="text-center text-xs text-muted-foreground mt-8">
              Secure access restricted to authorized personnel only.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
