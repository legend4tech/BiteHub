"use client"

import { useState } from "react"
import { Check, Copy, Share2 } from "lucide-react"

interface ReferralCardProps {
  referralCode: string
}

export function ReferralCard({ referralCode }: ReferralCardProps) {
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  const referralLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/customer/signup?ref=${referralCode}`
      : `https://bitehub.com/customer/signup?ref=${referralCode}`

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-background to-background p-6 shadow-sm">
      <div className="absolute -top-4 -right-4 opacity-5">
        <Share2 className="size-32" />
      </div>

      <div className="relative z-10">
        <div className="mb-4 flex items-center gap-2">
          <div className="rounded-lg bg-primary/20 p-2 text-primary">
            <Share2 className="size-5" />
          </div>
          <h2 className="text-xl font-bold">Refer & Earn</h2>
        </div>

        <p className="mb-6 text-sm text-muted-foreground">
          Share your referral code! We regularly run flash campaigns where your
          referrals can unlock Free Meals and BiteHub Coins. Build your network
          now so you&apos;re ready when the next big reward drops. Check the{" "}
          <strong>Milestones</strong> section to see what you can win today!
        </p>

        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 p-3">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">
                Your Code
              </p>
              <p className="font-mono text-lg font-bold tracking-wider text-primary">
                {referralCode}
              </p>
            </div>
            <button
              onClick={copyCode}
              className="flex size-10 items-center justify-center rounded-lg bg-background text-foreground shadow-sm transition-colors hover:bg-muted"
              title="Copy Code"
            >
              {copiedCode ? (
                <Check className="size-4 text-green-500" />
              ) : (
                <Copy className="size-4" />
              )}
            </button>
          </div>

          <button
            onClick={copyLink}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-primary/90 hover:shadow-lg active:scale-[0.98]"
          >
            {copiedLink ? (
              <>
                <Check className="size-4" />
                Link Copied!
              </>
            ) : (
              <>
                <Share2 className="size-4" />
                Copy Referral Link
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
