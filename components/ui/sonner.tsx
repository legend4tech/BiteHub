"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      toastOptions={{
        classNames: {
          toast: "group toast group-data-[type=success]:bg-green-500/10 group-data-[type=success]:text-green-600 group-data-[type=success]:border-green-500/20 group-data-[type=error]:bg-destructive/10 group-data-[type=error]:text-destructive group-data-[type=error]:border-destructive/20 group-data-[type=info]:bg-primary/10 group-data-[type=info]:text-primary group-data-[type=info]:border-primary/20 bg-card text-foreground border-border rounded-2xl shadow-xl p-4",
          description: "text-muted-foreground text-xs",
          actionButton: "bg-primary text-primary-foreground font-medium rounded-lg px-3 py-1.5",
          cancelButton: "bg-muted text-muted-foreground font-medium rounded-lg px-3 py-1.5",
          closeButton: "hover:bg-muted transition-colors rounded-full p-1",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
