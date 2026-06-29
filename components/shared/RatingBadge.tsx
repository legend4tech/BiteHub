import { Star } from "lucide-react"

interface RatingBadgeProps {
  rating?: number | null
  count?: number | null
  size?: "sm" | "md"
  className?: string
  showCount?: boolean
}

export function RatingBadge({
  rating,
  count,
  size = "sm",
  className = "",
  showCount = false,
}: RatingBadgeProps) {
  const hasRating = !!rating && rating > 0

  if (!hasRating) return null

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="flex items-center gap-1 rounded-full bg-rating/10 px-2 py-0.5 font-bold text-rating">
        <Star
          className={`${size === "sm" ? "size-3.5" : "size-4"} fill-rating text-rating`}
        />
        <span className={size === "sm" ? "text-xs" : "text-sm"}>
          {rating!.toFixed(1)}
        </span>
      </span>
      {showCount && count !== undefined && count !== null && (
        <span className="text-sm text-muted-foreground underline-offset-4 transition-colors group-hover:text-primary group-hover:underline">
          ({count} reviews)
        </span>
      )}
    </div>
  )
}
