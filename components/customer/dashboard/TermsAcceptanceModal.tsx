"use client"

import { useState } from "react"
import { AlertCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog"

interface TermsAcceptanceModalProps {
  open: boolean
  isNewcomer: boolean
  acceptingTerms: boolean
  onAccept: () => Promise<void>
}

export function TermsAcceptanceModal({
  open,
  isNewcomer,
  acceptingTerms,
  onAccept,
}: TermsAcceptanceModalProps) {
  const [acceptedCheckbox, setAcceptedCheckbox] = useState(false)

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="sm:max-w-[480px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 font-heading text-xl font-bold">
            <AlertCircle className="size-5 text-primary" />
            {!isNewcomer ? "Terms Updated" : "Welcome to BiteHub"}
          </AlertDialogTitle>
          <div className="space-y-4 pt-2">
            {!isNewcomer ? (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-foreground">
                <p className="text-xs leading-relaxed text-muted-foreground">
                  We&apos;ve updated our terms and privacy policy. Please review
                  and accept them to continue using your BiteHub account.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-foreground">
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Please accept our terms of use and privacy policy to access
                  your dashboard and place orders.
                </p>
              </div>
            )}

            <span className="block text-sm leading-relaxed text-muted-foreground">
              By checking the box, you agree to our{" "}
              <Link
                href="/terms"
                target="_blank"
                className="font-semibold text-primary underline transition-colors hover:text-primary/80"
              >
                Terms of Use
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                target="_blank"
                className="font-semibold text-primary underline transition-colors hover:text-primary/80"
              >
                Privacy Policy
              </Link>
              .
            </span>

            <div className="mt-2 flex items-start gap-2.5 rounded-xl border border-border bg-muted/20 p-3">
              <input
                id="accept-terms-checkbox"
                type="checkbox"
                checked={acceptedCheckbox}
                onChange={(e) => setAcceptedCheckbox(e.target.checked)}
                className="mt-1 size-4 cursor-pointer rounded border-border text-primary accent-primary focus:ring-primary focus:ring-offset-background"
              />
              <label
                htmlFor="accept-terms-checkbox"
                className="cursor-pointer text-xs leading-normal text-muted-foreground select-none"
              >
                I accept the Terms of Use and Privacy Policy.
              </label>
            </div>
          </div>
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-4">
          <Button
            onClick={onAccept}
            disabled={!acceptedCheckbox || acceptingTerms}
            className="w-full bg-primary font-bold text-primary-foreground hover:bg-primary/90"
          >
            {acceptingTerms ? "Processing..." : "I Agree & Accept"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
