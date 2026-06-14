import { useMemo } from "react"
import { Check, X } from "lucide-react"

const passwordRules = [
  {
    id: "length",
    label: "At least 8 characters",
    test: (v: string) => v.length >= 8,
  },
  {
    id: "uppercase",
    label: "At least one uppercase letter",
    test: (v: string) => /[A-Z]/.test(v),
  },
  {
    id: "lowercase",
    label: "At least one lowercase letter",
    test: (v: string) => /[a-z]/.test(v),
  },
  {
    id: "number",
    label: "At least one number",
    test: (v: string) => /[0-9]/.test(v),
  },
  {
    id: "special",
    label: "At least one special character",
    test: (v: string) => /[^A-Za-z0-9]/.test(v),
  },
]

const strengthConfig = [
  { label: "Weak", color: "bg-status-cancelled" },
  { label: "Fair", color: "bg-status-pending" },
  { label: "Good", color: "bg-status-confirmed" },
  { label: "Strong", color: "bg-status-completed" },
]

export function PasswordStrengthMeter({ password }: { password: string }) {
  const passed = useMemo(
    () => passwordRules.filter((r) => r.test(password)),
    [password]
  )
  const score = Math.min(
    Math.floor((passed.length / passwordRules.length) * 4),
    3
  )
  const show = password.length > 0

  if (!show) return null

  const cfg = strengthConfig[score]

  return (
    <div className="mt-2 space-y-2">
      {/* Bar */}
      <div className="flex gap-1">
        {strengthConfig.map((s, i) => (
          <div
            key={s.label}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              i <= score ? cfg.color : "bg-muted"
            }`}
          />
        ))}
      </div>
      <p
        className={`text-xs font-medium ${
          score === 3
            ? "text-green-600 dark:text-green-400"
            : score === 2
              ? "text-yellow-600 dark:text-yellow-400"
              : score === 1
                ? "text-orange-500"
                : "text-red-500"
        }`}
      >
        {cfg.label} password
      </p>

      {/* Rule checklist */}
      <ul className="space-y-1">
        {passwordRules.map((rule) => {
          const ok = rule.test(password)
          return (
            <li key={rule.id} className="flex items-center gap-1.5 text-xs">
              {ok ? (
                <Check className="size-3 shrink-0 text-green-500" />
              ) : (
                <X className="size-3 shrink-0 text-muted-foreground" />
              )}
              <span
                className={
                  ok
                    ? "text-green-600 dark:text-green-400"
                    : "text-muted-foreground"
                }
              >
                {rule.label}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
