"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useVendorAuth } from "@/hooks/useVendorAuth";
import { Button } from "@/components/ui/button";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { vendorLoginSchema } from "@/lib/schemas";
import { ZodError } from "zod";

export default function VendorLoginPage() {
  const { login } = useVendorAuth();
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setError("");
    
    try {
      vendorLoginSchema.parse({ phone, password });
      
      setLoading(true);
      setTimeout(() => {
        const result = login(phone.trim(), password);
        if (result.ok) {
          if (phone.trim() === "admin") {
            router.replace("/admin");
          } else {
            router.replace("/vendor/dashboard");
          }
        } else {
          setError(result.error ?? "Login failed.");
          setLoading(false);
        }
      }, 600);
    } catch (err) {
      if (err instanceof ZodError) {
        const newErrors: Record<string, string> = {};
        (err as any).errors.forEach((e: any) => {
          if (e.path[0]) {
            newErrors[e.path[0] as string] = e.message;
          }
        });
        setErrors(newErrors);
      }
    }
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
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Phone / ID</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setErrors((p) => ({ ...p, phone: "" })); }}
                placeholder="e.g. 2348012345678"
                autoComplete="username"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
              {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: "" })); }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 pr-11 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <button type="button" onClick={() => setShowPw((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
            </div>

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
