"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Loader2, CheckCircle2, XCircle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { useConfirmEmail } from "@/hooks/mutations/usePublicMutations"
import { useSession, signOut } from "next-auth/react"
import { toast } from "sonner"
import Link from "next/link"
import { useRef } from "react"

function ConfirmEmailContent() {
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const token = searchParams.get("token")
  const email = searchParams.get("email")

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  )
  const [errorMessage, setErrorMessage] = useState("")
  const hasAttempted = useRef(false)

  const confirmEmailMutation = useConfirmEmail()

  useEffect(() => {
    if (!token || !email) {
      setTimeout(() => {
        setStatus("error")
        setErrorMessage("Invalid verification link. Missing token or email.")
      }, 0)
      return
    }

    if (hasAttempted.current) return
    hasAttempted.current = true

    confirmEmailMutation.mutate(
      { token, email },
      {
        onSuccess: () => {
          setStatus("success")
          toast.success("Email updated. Please log in with your new email.")
          setTimeout(() => {
            signOut({ callbackUrl: "/vendor/login" })
          }, 4000)
        },
        onError: (error: unknown) => {
          const err = error as { response?: { data?: { message?: string } } }
          setStatus("error")
          setErrorMessage(
            err.response?.data?.message ||
              "Verification failed. The link might be expired."
          )
        },
      }
    )
  }, [token, email, confirmEmailMutation])

  const isLoggedIn = !!session?.user

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-card/50 p-8 text-center backdrop-blur-xl"
    >
      {status === "loading" && (
        <div className="space-y-6">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
            <Loader2 className="size-8 animate-spin" />
          </div>
          <h1 className="font-heading text-2xl font-bold">Verifying Email</h1>
          <p className="text-muted-foreground">
            Please wait while we verify your new email address...
          </p>
        </div>
      )}

      {status === "success" && (
        <div className="space-y-6">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-success/10 text-success">
            <CheckCircle2 className="size-8" />
          </div>
          <h1 className="font-heading text-2xl font-bold">Email Verified!</h1>
          <p className="text-muted-foreground">
            Your email has been successfully updated. Because your login
            credentials have changed, you must sign in again.
          </p>
          <Button
            variant="hero"
            className="mt-4 h-12 w-full rounded-xl text-sm font-bold"
            onClick={() => signOut({ callbackUrl: "/vendor/login" })}
          >
            Sign In Again <ArrowRight className="ml-2 size-4" />
          </Button>
        </div>
      )}

      {status === "error" && (
        <div className="space-y-6">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-destructive/10 text-destructive">
            <XCircle className="size-8" />
          </div>
          <h1 className="font-heading text-2xl font-bold">
            Verification Failed
          </h1>
          <p className="text-muted-foreground">{errorMessage}</p>
          <Button
            asChild
            variant="hero"
            className="mt-4 h-12 w-full rounded-xl text-sm font-bold"
          >
            <Link href={isLoggedIn ? "/vendor/settings" : "/vendor/login"}>
              {isLoggedIn ? "Back to Settings" : "Return to Login"}{" "}
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </div>
      )}
    </motion.div>
  )
}

export default function ConfirmEmailPage() {
  const { status } = useSession()
  const isAuth = status === "authenticated"

  return (
    <div
      className={
        isAuth
          ? "flex flex-col items-center py-6"
          : "flex min-h-screen flex-col items-center justify-center bg-background p-4"
      }
    >
      {/* Background decoration */}
      {!isAuth && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 -mt-48 -mr-48 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[100px]" />
        </div>
      )}

      <Suspense
        fallback={
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
            <Loader2 className="size-8 animate-spin" />
          </div>
        }
      >
        <ConfirmEmailContent />
      </Suspense>
    </div>
  )
}
