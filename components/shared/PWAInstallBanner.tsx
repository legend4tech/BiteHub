"use client"

import { useState } from "react"
import { usePWAInstall } from "@/hooks/usePWAInstall"
import { Button } from "@/components/ui/button"
import { Download, X, Smartphone } from "lucide-react"

export function PWAInstallBanner() {
  const { isInstallable, installApp } = usePWAInstall()
  const [dismissed, setDismissed] = useState(false)

  if (!isInstallable || dismissed) return null

  return (
    <div className="fixed bottom-4 left-4 z-[98] max-w-[320px] rounded-2xl border border-border bg-background p-4 shadow-2xl transition-all duration-300 sm:bottom-6 sm:left-6 sm:max-w-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <Smartphone className="size-5" />
          </div>
          <div>
            <h4 className="font-heading leading-tight font-bold text-foreground">
              Get the BiteHub App
            </h4>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Install for a faster, better experience
            </p>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Dismiss install prompt"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="mt-4">
        <Button
          onClick={installApp}
          className="w-full bg-primary font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90"
        >
          <Download className="mr-2 size-4" />
          Install Now
        </Button>
      </div>
    </div>
  )
}
