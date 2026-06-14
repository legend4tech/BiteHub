import { LucideIcon } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface AlertBannerProps {
  title: string
  description: string
  icon: LucideIcon
  variant?: "default" | "destructive" | "warning" | "success" | "info"
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
}

export function AlertBanner({
  title,
  description,
  icon: Icon,
  variant = "default",
  action,
}: AlertBannerProps) {
  const styles = {
    default: "border-border bg-card text-foreground",
    destructive: "border-destructive/20 bg-destructive/10 text-destructive",
    warning:
      "border-status-pending/20 bg-status-pending/10 text-status-pending-foreground",
    success:
      "border-status-completed/20 bg-status-completed/10 text-status-completed-foreground",
    info: "border-status-confirmed/20 bg-status-confirmed/10 text-status-confirmed-foreground",
  }

  const buttonVariants = {
    default: "default",
    destructive: "destructive",
    warning: "default",
    success: "default",
    info: "default",
  } as const

  return (
    <div
      className={`flex flex-col justify-between gap-4 rounded-2xl border px-5 py-4 sm:flex-row sm:items-center ${styles[variant]}`}
    >
      <div className="flex items-start gap-3 sm:items-center">
        <Icon
          className={`mt-0.5 size-5 shrink-0 sm:mt-0 ${styles[variant].split(" ").pop()}`}
        />
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
      </div>

      {action && (
        <div className="shrink-0">
          {action.href ? (
            <Button asChild size="sm" variant={buttonVariants[variant]}>
              <Link href={action.href}>{action.label}</Link>
            </Button>
          ) : (
            <Button
              size="sm"
              variant={buttonVariants[variant]}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
