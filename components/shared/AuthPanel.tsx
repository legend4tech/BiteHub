import Link from "next/link"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { APP_NAME, APP_LOGO_URL } from "@/lib/constants"

interface AuthPanelFeature {
  icon: LucideIcon
  text: string
}

interface AuthPanelProps {
  /** "vendor" = orange gradient, "admin" = dark slate */
  variant?: "vendor" | "admin"
  bgImage?: string
  badge?: string
  badgeIcon?: LucideIcon
  headline: string
  subline: string
  features: AuthPanelFeature[]
  footerText: string
  footerIcon?: LucideIcon
}

export function AuthPanel({
  variant = "vendor",
  bgImage,
  badge,
  badgeIcon: BadgeIcon,
  headline,
  subline,
  features,
  footerText,
  footerIcon: FooterIcon,
}: AuthPanelProps) {
  const isAdmin = variant === "admin"

  return (
    <div
      className={cn(
        "relative hidden flex-col overflow-hidden p-12 lg:flex lg:w-1/2 xl:w-[55%]",
        !bgImage && isAdmin && "border-r border-border bg-card",
        !bgImage && !isAdmin && "bg-primary"
      )}
    >
      {/* ── Background Image & Overlay ── */}
      {bgImage && (
        <>
          <div
            className="absolute inset-0 z-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${bgImage})` }}
          />
          <div
            className={cn(
              "absolute inset-0 z-0",
              isAdmin ? "bg-card/90" : "bg-primary/90"
            )}
          />
        </>
      )}

      {/* ── Decorative blobs / lines ── */}
      {!bgImage && isAdmin && (
        <>
          <div className="pointer-events-none absolute top-0 right-0 z-0 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-0 z-0 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
          {/* Grid overlay */}
          <div
            className="absolute inset-0 z-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
          {/* Accent lines */}
          <div className="absolute top-1/3 left-1/4 z-0 h-48 w-px bg-gradient-to-b from-transparent via-primary/30 to-transparent" />
          <div className="absolute top-1/2 right-1/4 z-0 h-32 w-px bg-gradient-to-b from-transparent via-primary/20 to-transparent" />
        </>
      )}
      {!bgImage && !isAdmin && (
        <>
          <div className="pointer-events-none absolute -top-24 -left-24 z-0 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -right-24 -bottom-24 z-0 h-80 w-80 rounded-full bg-black/10 blur-3xl" />
          <div className="pointer-events-none absolute top-1/2 left-1/2 z-0 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5 blur-3xl" />
        </>
      )}

      {/* ── Brand ── */}
      <Link
        href="/"
        className="group relative z-10 flex w-fit items-center gap-2.5"
      >
        <img
          src={APP_LOGO_URL}
          alt={APP_NAME}
          className="h-12 w-auto rounded-xl object-contain transition-all duration-300 group-hover:scale-105 group-hover:-rotate-2"
        />
        <div className="flex flex-col -space-y-1">
          <span className="font-heading text-2xl leading-none font-black tracking-tight text-white">
            BiteHub
          </span>
        </div>
      </Link>

      {/* ── Centre content ── */}
      <div className="relative z-10 mt-12 flex flex-1 flex-col justify-center">
        {/* Badge */}
        {badge && (
          <div className="mb-4">
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold tracking-widest uppercase",
                isAdmin
                  ? "border border-primary/20 bg-primary/10 text-primary"
                  : "bg-white/15 text-white/90 backdrop-blur-sm"
              )}
            >
              {BadgeIcon && <BadgeIcon className="size-3" />}
              {badge}
            </span>
          </div>
        )}

        {/* Headline */}
        <h2
          className={cn(
            "mt-2 font-heading text-4xl leading-tight font-bold xl:text-5xl",
            isAdmin ? "text-white" : "text-white"
          )}
          dangerouslySetInnerHTML={{ __html: headline }}
        />
        <p
          className={cn(
            "mt-4 max-w-md text-base leading-relaxed",
            isAdmin ? "text-muted-foreground" : "text-primary-foreground/80"
          )}
        >
          {subline}
        </p>

        {/* Features */}
        <div className="mt-8 space-y-4">
          {features.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <div
                className={cn(
                  "grid h-9 w-9 shrink-0 place-items-center rounded-xl",
                  isAdmin
                    ? "border border-border bg-accent"
                    : "bg-white/15 backdrop-blur-sm"
                )}
              >
                <Icon
                  className={cn(
                    "size-4.5",
                    isAdmin
                      ? "text-muted-foreground"
                      : "text-primary-foreground"
                  )}
                />
              </div>
              <span
                className={cn(
                  "text-sm font-medium",
                  isAdmin
                    ? "text-muted-foreground"
                    : "text-primary-foreground/90"
                )}
              >
                {text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer badge ── */}
      <div className="relative z-10 mt-12">
        <div
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium",
            isAdmin
              ? "border border-border bg-accent text-muted-foreground"
              : "bg-white/15 text-white backdrop-blur-sm"
          )}
        >
          {FooterIcon && (
            <FooterIcon
              className={cn(
                "size-3.5",
                isAdmin ? "text-primary" : "text-white"
              )}
            />
          )}
          {!FooterIcon && (
            <span className="h-2 w-2 animate-pulse rounded-full bg-success" />
          )}
          {footerText}
        </div>
      </div>
    </div>
  )
}
