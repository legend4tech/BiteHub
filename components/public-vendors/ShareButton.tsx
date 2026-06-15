"use client"

import { useState } from "react"
import { Share2, Check } from "lucide-react"

interface ShareButtonProps {
  urlPath?: string
  title?: string
  buttonText?: string
}

export function ShareButton({
  urlPath,
  title = "Check this out on BiteHub!",
  buttonText = "Share",
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const url = urlPath
      ? `${window.location.origin}${urlPath}`
      : window.location.href

    let copySuccess = false

    // 1. Always copy to clipboard first while we have user interaction (transient activation)
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url)
        copySuccess = true
      } else {
        throw new Error("Clipboard API not available")
      }
    } catch {
      try {
        // Fallback for older browsers
        const ta = document.createElement("textarea")
        ta.value = url
        document.body.appendChild(ta)
        ta.select()
        document.execCommand("copy")
        document.body.removeChild(ta)
        copySuccess = true
      } catch {
        // Ignore
      }
    }

    if (copySuccess) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }

    // 2. Open native share sheet if supported
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url,
        })
      } catch {
        // User cancelled or share failed, but we already copied it to clipboard!
      }
    }
  }

  return (
    <button
      onClick={handleShare}
      aria-label="Copy link"
      className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium ring-2 transition-all duration-200 ${
        copied
          ? "border-status-completed/50 bg-status-completed/10 text-status-completed-foreground ring-status-completed/40"
          : "border-primary/50 bg-background text-primary ring-primary/30 hover:bg-primary/5 hover:ring-primary/50"
      }`}
    >
      {copied ? (
        <>
          <Check className="size-4" />
          Link copied!
        </>
      ) : (
        <>
          <Share2 className="size-4" />
          {buttonText}
        </>
      )}
    </button>
  )
}
