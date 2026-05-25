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
      "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-500",
    success:
      "border-green-500/20 bg-green-500/10 text-green-600 dark:text-green-500",
    info: "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-500",
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
