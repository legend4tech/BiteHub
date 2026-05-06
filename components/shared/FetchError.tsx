"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import {
  WifiOff,
  ServerCrash,
  ShieldAlert,
  Clock,
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── FetchError ───────────────────────────────────────────────────────────────
// A fully reusable error component for when a data fetch fails.
// Shows the error, explains possible reasons, and gives the user actions.
//
// Usage:
//   <FetchError onRetry={() => refetch()} />
//   <FetchError message="Could not load vendors." onRetry={refetch} />
//   <FetchError
//     title="Failed to load your orders"
//     message="We couldn't reach our servers right now."
//     reasons={["No internet connection", "Server maintenance"]}
//     onRetry={refetch}
//   />
//   <FetchError size="sm" />

// ─── Types ─────────────────────────────────────────────────────────────────────

type FetchErrorSize = "sm" | "md" | "lg";

interface FetchErrorProps {
  /** Short heading shown above the message */
  title?: string;
  /** Optional override of the default error message */
  message?: string;
  /** Custom list of possible reasons — overrides the defaults */
  reasons?: string[];
  /** Called when the user clicks "Try again" */
  onRetry?: () => void;
  /** Called / href when the user clicks "Go back" */
  onBack?: (() => void) | string;
  /** Size variant */
  size?: FetchErrorSize;
  /** Extra class on the root wrapper */
  className?: string;
  /** Optional custom icon */
  icon?: ReactNode;
}

// ─── Default reasons shown to the user ────────────────────────────────────────

const DEFAULT_REASONS: { icon: ReactNode; text: string }[] = [
  {
    icon: <WifiOff className="size-3.5 shrink-0" />,
    text: "No internet connection or a very slow network",
  },
  {
    icon: <ServerCrash className="size-3.5 shrink-0" />,
    text: "Our server is temporarily unavailable",
  },
  {
    icon: <Clock className="size-3.5 shrink-0" />,
    text: "The request took too long and timed out",
  },
  {
    icon: <ShieldAlert className="size-3.5 shrink-0" />,
    text: "A firewall or VPN may be blocking the connection",
  },
];

// ─── Size tokens ──────────────────────────────────────────────────────────────

const sizeMap: Record<
  FetchErrorSize,
  {
    wrapper: string;
    iconBox: string;
    iconSize: string;
    title: string;
    message: string;
    reasonText: string;
  }
> = {
  sm: {
    wrapper: "py-8 px-4 max-w-sm",
    iconBox: "h-12 w-12",
    iconSize: "size-5",
    title: "text-sm font-bold",
    message: "text-xs",
    reasonText: "text-xs",
  },
  md: {
    wrapper: "py-14 px-6 max-w-md",
    iconBox: "h-16 w-16",
    iconSize: "size-7",
    title: "text-lg font-bold",
    message: "text-sm",
    reasonText: "text-xs",
  },
  lg: {
    wrapper: "py-20 px-8 max-w-lg",
    iconBox: "h-20 w-20",
    iconSize: "size-9",
    title: "text-2xl font-bold",
    message: "text-base",
    reasonText: "text-sm",
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function FetchError({
  title = "Something went wrong",
  message = "We couldn't load this content. This is usually a temporary issue.",
  reasons,
  onRetry,
  onBack,
  size = "md",
  className = "",
  icon,
}: FetchErrorProps) {
  const s = sizeMap[size];
  const displayReasons = reasons
    ? reasons.map((r) => ({ icon: <AlertTriangle className="size-3.5 shrink-0" />, text: r }))
    : DEFAULT_REASONS;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={`flex flex-col items-center justify-center text-center w-full mx-auto ${s.wrapper} ${className}`}
    >
      {/* Error icon */}
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.45, delay: 0.08, type: "spring", stiffness: 200 }}
        className={`relative flex items-center justify-center rounded-2xl mb-6 ${s.iconBox}`}
      >
        {/* Pulsing red ring */}
        <span className="absolute inset-0 rounded-2xl bg-destructive/10 animate-pulse" />
        <span className="absolute inset-0 rounded-2xl ring-1 ring-destructive/30" />
        <span className="relative text-destructive">
          {icon ?? <ServerCrash className={s.iconSize} />}
        </span>
      </motion.div>

      {/* Heading + message */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.18 }}
        className="space-y-2"
      >
        <h3 className={`text-foreground ${s.title}`}>{title}</h3>
        <p className={`text-muted-foreground leading-relaxed ${s.message}`}>{message}</p>
      </motion.div>

      {/* Possible reasons card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.28 }}
        className="mt-6 w-full rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-4 text-left space-y-2.5"
      >
        <p className={`font-semibold text-muted-foreground mb-3 ${s.reasonText}`}>
          Possible reasons:
        </p>
        {displayReasons.map((reason, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.3 + i * 0.06 }}
            className={`flex items-start gap-2.5 text-muted-foreground ${s.reasonText}`}
          >
            <span className="mt-0.5 text-destructive/70">{reason.icon}</span>
            <span>{reason.text}</span>
          </motion.div>
        ))}
      </motion.div>

      {/* Actions */}
      {(onRetry || onBack) && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.45 }}
          className="mt-6 flex flex-wrap items-center justify-center gap-3"
        >
          {onRetry && (
            <Button
              variant="hero"
              size={size === "sm" ? "sm" : "default"}
              onClick={onRetry}
              className="gap-2"
            >
              <RefreshCw className="size-4" />
              Try again
            </Button>
          )}

          {onBack && (
            <Button
              variant="outline"
              size={size === "sm" ? "sm" : "default"}
              onClick={typeof onBack === "function" ? onBack : undefined}
              asChild={typeof onBack === "string"}
              className="gap-2"
            >
              {typeof onBack === "string" ? (
                <a href={onBack}>
                  <ArrowLeft className="size-4" />
                  Go back
                </a>
              ) : (
                <>
                  <ArrowLeft className="size-4" />
                  Go back
                </>
              )}
            </Button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
