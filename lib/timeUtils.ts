export function isItemAvailableNow(
  isAvailable: boolean,
  availableFrom: string | null | undefined,
  availableTo: string | null | undefined,
  availableDays: string[] | undefined,
  quantityAvailable?: number | null,
  isPreorder?: boolean,
  preorderEndDate?: Date | string | null
): boolean {
  if (!isAvailable) return false

  // Handle sold out items
  if (
    quantityAvailable !== undefined &&
    quantityAvailable !== null &&
    quantityAvailable <= 0
  ) {
    return false
  }

  const now = new Date()

  // Pre-orders bypass daily schedules if the end date hasn't passed
  if (isPreorder) {
    if (preorderEndDate) {
      const endDate = new Date(preorderEndDate)
      return now.getTime() <= endDate.getTime()
    }
    return true
  }

  // Use West Africa Time (WAT) for Nigerian students by default,
  // or fall back to system local time if Intl is not supported.
  // Actually, simpler to just get local time string in a specific timezone if we can,
  // but to avoid complex timezone math, let's get the current day and time using Intl
  const options: Intl.DateTimeFormatOptions = { timeZone: "Africa/Lagos" }

  const dayName = new Intl.DateTimeFormat("en-US", {
    ...options,
    weekday: "long",
  }).format(now)

  if (availableDays && availableDays.length > 0) {
    if (!availableDays.includes(dayName)) {
      return false
    }
  }

  if (availableFrom || availableTo) {
    const timeString = new Intl.DateTimeFormat("en-US", {
      ...options,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(now) // e.g. "14:30" or "24:30" (wait, 24-hour can be "24:00" in some runtimes, usually "00:00" to "23:59")

    // Node 18+ might return '24:00' for midnight. Let's handle standard formatting:
    const [hourStr, minStr] = timeString.split(":")
    const currentMinutes = parseInt(hourStr) * 60 + parseInt(minStr)

    if (availableFrom) {
      const [fromH, fromM] = availableFrom.split(":")
      const fromMinutes = parseInt(fromH) * 60 + parseInt(fromM)
      if (currentMinutes < fromMinutes) return false
    }

    if (availableTo) {
      const [toH, toM] = availableTo.split(":")
      const toMinutes = parseInt(toH) * 60 + parseInt(toM)

      // Handle cases where availableTo is "00:00" or similar meaning midnight
      // If from > to, it means it crosses midnight (e.g. 20:00 to 02:00)
      if (availableFrom) {
        const [fromH, fromM] = availableFrom.split(":")
        const fromMinutes = parseInt(fromH) * 60 + parseInt(fromM)
        if (fromMinutes > toMinutes) {
          // Crosses midnight.
          // It's available if time >= fromMinutes OR time <= toMinutes
          if (currentMinutes < fromMinutes && currentMinutes > toMinutes) {
            return false
          }
          return true
        }
      }

      if (currentMinutes > toMinutes) return false
    }
  }

  return true
}

/**
 * Formats a date string or object into a human-readable time (e.g., "02:30 PM")
 */
export function formatTime(date: Date | string | number): string {
  if (!date) return ""
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(date))
}

/**
 * Formats a date string or object into a human-readable date (e.g., "May 31, 2026")
 */
export function formatDate(date: Date | string | number): string {
  if (!date) return ""
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date))
}
