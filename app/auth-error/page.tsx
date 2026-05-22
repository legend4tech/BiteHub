"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function AuthErrorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const error = searchParams.get("error");
    
    // Toast a user-friendly message based on the error code
    if (error === "Configuration" || error === "AccessDenied") {
      toast.error("Authentication service error. Please try again.");
    } else if (error) {
      // Decode the error if it's a custom message passed in URL, else show generic
      const decodedError = decodeURIComponent(error).replace("CredentialsSignin: ", "");
      toast.error(decodedError || "An unexpected error occurred during login. Please try again.");
    } else {
      toast.error("Network or authentication error. Please try again.");
    }

    // Attempt to send them back to the login page they came from
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.replace("/");
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background space-y-4">
      <Loader2 className="size-8 animate-spin text-primary" />
      <p className="text-muted-foreground text-sm font-medium">Redirecting back to login...</p>
    </div>
  );
}
