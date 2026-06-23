"use client"

import { DotLottieReact } from "@lottiefiles/dotlottie-react"
import { motion } from "framer-motion"
import { ReactNode } from "react"
import { Button } from "@/components/ui/button"

// ─── EmptyState ───────────────────────────────────────────────────────────────
// A fully reusable empty-state component. Drop it anywhere there's no data.
//
// Usage:
//   <EmptyState />
//   <EmptyState title="No vendors yet" description="Check back soon!" />
//   <EmptyState
//     title="No results found"
//     description="Try a different search term."
//     action={{ label: "Clear search", onClick: () => setQuery("") }}
//   />
//   <EmptyState size="sm" icon="🔍" title="Nothing matched" />

interface EmptyStateAction {
  label: string
  onClick?: () => void
  href?: string
  icon?: ReactNode
}

type EmptyStateSize = "sm" | "md" | "lg"

interface EmptyStateProps {
  /** Main heading */
  title?: string
  /** Supporting paragraph */
  description?: string
  /** Optional emoji or ReactNode to show instead of the illustration */
  icon?: ReactNode
  /** Whether to show the illustrated image (default: true) */
  showImage?: boolean
  /** Primary CTA */
  action?: EmptyStateAction
  /** Secondary CTA */
  secondaryAction?: EmptyStateAction
  /** Size variant — controls padding, image size and text scale */
  size?: EmptyStateSize
  /** Extra classes applied to the root wrapper */
  className?: string
}

const sizeMap: Record<
  EmptyStateSize,
  { wrapper: string; lottie: number; title: string; desc: string }
> = {
  sm: {
    wrapper: "py-10 px-4",
    lottie: 140,
    title: "text-base font-semibold",
    desc: "text-xs",
  },
  md: {
    wrapper: "py-16 px-6",
    lottie: 200,
    title: "text-xl font-bold",
    desc: "text-sm",
  },
  lg: {
    wrapper: "py-24 px-8",
    lottie: 260,
    title: "text-2xl font-bold",
    desc: "text-base",
  },
}

export function EmptyState({
  title = "Nothing here yet",
  description = "There's no data to display right now. Check back later.",
  icon,
  showImage = true,
  action,
  secondaryAction,
  size = "md",
  className = "",
}: EmptyStateProps) {
  const s = sizeMap[size]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={`flex w-full flex-col items-center justify-center text-center ${s.wrapper} ${className}`}
    >
      {/* Illustration / icon */}
      {icon ? (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-6 text-5xl"
        >
          {icon}
        </motion.div>
      ) : showImage ? (
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative mb-2"
          style={{ width: s.lottie, height: s.lottie }}
        >
          <DotLottieReact
            src="https://lottie.host/31b63bd1-29b8-45f7-8eb1-90635bf713c8/KmQceBnItc.lottie"
            loop
            autoplay
            style={{ width: "100%", height: "100%" }}
          />
        </motion.div>
      ) : null}

      {/* Text */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="max-w-sm space-y-2"
      >
        <h3 className={`text-foreground ${s.title}`}>{title}</h3>
        <p className={`leading-relaxed text-muted-foreground ${s.desc}`}>
          {description}
        </p>
      </motion.div>

      {/* Actions */}
      {(action || secondaryAction) && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-6 flex flex-wrap items-center justify-center gap-3"
        >
          {action && (
            <Button
              variant="hero"
              size={size === "sm" ? "sm" : "default"}
              onClick={action.onClick}
              asChild={!!action.href}
            >
              {action.href ? (
                <a href={action.href}>
                  {action.icon && <span className="mr-2">{action.icon}</span>}
                  {action.label}
                </a>
              ) : (
                <>
                  {action.icon && <span className="mr-2">{action.icon}</span>}
                  {action.label}
                </>
              )}
            </Button>
          )}

          {secondaryAction && (
            <Button
              variant="outline"
              size={size === "sm" ? "sm" : "default"}
              onClick={secondaryAction.onClick}
              asChild={!!secondaryAction.href}
            >
              {secondaryAction.href ? (
                <a href={secondaryAction.href}>
                  {secondaryAction.icon && (
                    <span className="mr-2">{secondaryAction.icon}</span>
                  )}
                  {secondaryAction.label}
                </a>
              ) : (
                <>
                  {secondaryAction.icon && (
                    <span className="mr-2">{secondaryAction.icon}</span>
                  )}
                  {secondaryAction.label}
                </>
              )}
            </Button>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}
