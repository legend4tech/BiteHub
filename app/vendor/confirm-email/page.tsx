"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import axios from "axios";
import { useSession, signOut } from "next-auth/react";
import { toast } from "sonner";
import Link from "next/link";
import { useRef } from "react";

function ConfirmEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const hasAttempted = useRef(false);

  useEffect(() => {
    if (!token || !email) {
      setStatus("error");
      setErrorMessage("Invalid verification link. Missing token or email.");
      return;
    }

    if (hasAttempted.current) return;
    hasAttempted.current = true;

    const confirmEmail = async () => {
      try {
        await axios.get(`/api/vendor/account/confirm-email?token=${token}&email=${encodeURIComponent(email)}`);
        setStatus("success");
        toast.success("Email updated. Please log in with your new email.");
        setTimeout(() => {
          signOut({ callbackUrl: "/vendor/login" });
        }, 4000);
      } catch (error: any) {
        setStatus("error");
        setErrorMessage(error.response?.data?.message || "Verification failed. The link might be expired.");
      }
    };

    confirmEmail();
  }, [token, email]);

  const isLoggedIn = !!session?.user;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md bg-card/50 backdrop-blur-xl border border-white/10 p-8 rounded-3xl text-center relative z-10"
    >
      {status === "loading" && (
        <div className="space-y-6">
          <div className="h-16 w-16 bg-primary/10 text-primary rounded-full grid place-items-center mx-auto">
            <Loader2 className="size-8 animate-spin" />
          </div>
          <h1 className="font-heading text-2xl font-bold">Verifying Email</h1>
          <p className="text-muted-foreground">Please wait while we verify your new email address...</p>
        </div>
      )}

      {status === "success" && (
        <div className="space-y-6">
          <div className="h-16 w-16 bg-green-500/10 text-green-500 rounded-full grid place-items-center mx-auto">
            <CheckCircle2 className="size-8" />
          </div>
          <h1 className="font-heading text-2xl font-bold">Email Verified!</h1>
          <p className="text-muted-foreground">
            Your email has been successfully updated. Because your login credentials have changed, you must sign in again.
          </p>
          <Button
            variant="hero"
            className="w-full h-12 rounded-xl text-sm font-bold mt-4"
            onClick={() => signOut({ callbackUrl: "/vendor/login" })}
          >
            Sign In Again <ArrowRight className="ml-2 size-4" />
          </Button>
        </div>
      )}

      {status === "error" && (
        <div className="space-y-6">
          <div className="h-16 w-16 bg-destructive/10 text-destructive rounded-full grid place-items-center mx-auto">
            <XCircle className="size-8" />
          </div>
          <h1 className="font-heading text-2xl font-bold">Verification Failed</h1>
          <p className="text-muted-foreground">
            {errorMessage}
          </p>
          <Button
            asChild
            variant="hero"
            className="w-full h-12 rounded-xl text-sm font-bold mt-4"
          >
            <Link href={isLoggedIn ? "/vendor/settings" : "/vendor/login"}>
              {isLoggedIn ? "Back to Settings" : "Return to Login"} <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </div>
      )}
    </motion.div>
  );
}

export default function ConfirmEmailPage() {
  const { status } = useSession();
  const isAuth = status === "authenticated";

  return (
    <div className={isAuth ? "py-6 flex flex-col items-center" : "min-h-screen bg-background flex flex-col items-center justify-center p-4"}>
      {/* Background decoration */}
      {!isAuth && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -mr-48 -mt-48" />
        </div>
      )}

      <Suspense fallback={<div className="h-16 w-16 bg-primary/10 text-primary rounded-full grid place-items-center mx-auto"><Loader2 className="size-8 animate-spin" /></div>}>
        <ConfirmEmailContent />
      </Suspense>
    </div>
  );
}
