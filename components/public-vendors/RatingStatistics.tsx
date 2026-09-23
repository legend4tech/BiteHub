import { Star } from "lucide-react"
import type { RatingStatisticsData } from "@/types/vendor"

interface RatingStatisticsProps {
  statistics: RatingStatisticsData | undefined
  activeFilter?: number | null
  onFilterChange?: (rating: number | null) => void
}

export function RatingStatistics({
  statistics,
  activeFilter = null,
  onFilterChange,
}: RatingStatisticsProps) {
  if (!statistics) return null

  const { averageRating, totalReviews, distribution } = statistics

  // E-commerce style usually shows 5 stars at the top, down to 1 star
  const starLevels = [5, 4, 3, 2, 1] as const

  return (
    <div className="mb-10 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-8 md:flex-row md:items-center">
        {/* Left column: Average Rating */}
        <div className="flex shrink-0 flex-col items-center justify-center md:w-1/3 md:border-r md:border-border">
          <div className="flex items-end gap-1">
            <span className="font-heading text-6xl font-bold tracking-tighter">
              {averageRating.toFixed(1)}
            </span>
            <span className="mb-1.5 text-xl text-muted-foreground">/ 5</span>
          </div>

          <div className="mt-2 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`size-5 ${
                  Math.round(averageRating) >= star
                    ? "fill-warning text-warning"
                    : "text-muted-foreground/30"
                }`}
              />
            ))}
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            Based on {totalReviews} rating{totalReviews !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Right column: Distribution Bars */}
        <div className="flex flex-1 flex-col gap-3 md:pl-4">
          {starLevels.map((level) => {
            const count = distribution[level] || 0
            const percentage =
              totalReviews > 0 ? (count / totalReviews) * 100 : 0

            const isActive = activeFilter === level
            const isDimmed = activeFilter !== null && !isActive

            return (
              <button
                key={level}
                onClick={() => onFilterChange?.(isActive ? null : level)}
                className={`group flex items-center gap-4 text-sm transition-opacity hover:opacity-100 ${
                  isDimmed ? "opacity-40" : "opacity-100"
                }`}
                aria-pressed={isActive}
                aria-label={`Filter by ${level} stars`}
              >
                <div className="flex w-12 shrink-0 items-center gap-1 font-medium transition-colors group-hover:text-warning">
                  {level}{" "}
                  <Star
                    className={`size-3.5 ${isActive ? "fill-warning text-warning" : "fill-muted text-muted group-hover:fill-warning group-hover:text-warning"}`}
                  />
                </div>

                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${isActive ? "bg-warning" : "bg-warning/40 group-hover:bg-warning"}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <div className="w-10 shrink-0 text-right text-muted-foreground transition-colors group-hover:text-foreground">
                  {Math.round(percentage)}%
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
