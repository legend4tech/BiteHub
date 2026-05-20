"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowLeft, KeyRound, CheckCircle2 } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { toast } from "sonner";
import { APP_NAME, APP_LOGO_URL } from "@/lib/constants";
import axios from "axios";

const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});
type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema as any),
    defaultValues: { email: "" },
  });

  // Pre-fill email from query parameters
  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      form.setValue("email", decodeURIComponent(emailParam));
    }
  }, [searchParams, form]);

  const onSubmit = async (values: ForgotPasswordValues) => {
    setLoading(true);
    try {
      await axios.post("/api/vendor/forgot-password", {
        email: values.email.trim(),
      });
      setSubmitted(true);
      toast.success("Verification link sent!");
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || "Something went wrong. Please try again.";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-6 py-12 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -ml-20 -mt-20 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-600/5 rounded-full blur-3xl -mr-20 -mb-20 pointer-events-none" />

      <div className="w-full max-w-[440px] z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="flex items-center gap-2 mb-6">
            <img 
              src={APP_LOGO_URL} 
              alt={APP_NAME} 
              className="h-10 w-auto object-contain rounded-lg" 
            />
            <span className="font-heading font-black text-2xl tracking-tight text-foreground">
              Bite<span className="text-primary">Hub</span>
            </span>
          </div>

          <div className="h-12 w-12 rounded-2xl bg-primary/10 grid place-items-center mb-4">
            <KeyRound className="size-6 text-primary" />
          </div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">Forgot Password</h1>
          <p className="text-muted-foreground mt-2 text-sm max-w-sm">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-3xl border border-border bg-card p-8 shadow-xl shadow-primary/5">
          {!submitted ? (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Email Address</FieldLabel>
                    <Input 
                      {...field} 
                      id={field.name} 
                      type="email" 
                      placeholder="vendor@example.com" 
                      autoComplete="email" 
                      aria-invalid={fieldState.invalid} 
                      className="h-11" 
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Button 
                type="submit" 
                variant="hero" 
                className="w-full h-11 text-base mt-2" 
                disabled={loading}
              >
                {loading && <Loader2 className="size-4 animate-spin mr-2" />}
                {loading ? "Sending link…" : "Send Reset Link"}
              </Button>
            </form>
          ) : (
            <div className="text-center py-4 space-y-4">
              <div className="mx-auto h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 grid place-items-center mb-2">
                <CheckCircle2 className="size-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-heading text-lg font-semibold text-foreground">Check your inbox</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                If an active vendor account matches <strong>{form.getValues("email")}</strong>, we have sent a secure link to reset your password.
              </p>
              <p className="text-xs text-muted-foreground">
                Be sure to check your spam or junk folder if you don't receive it in a few minutes.
              </p>
            </div>
          )}
        </div>

        {/* Back Link */}
        <div className="mt-6 text-center">
          <Link 
            href="/vendor/login" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="size-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
