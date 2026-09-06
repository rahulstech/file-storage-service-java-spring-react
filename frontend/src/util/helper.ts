// Utility to format bytes into readable strings (e.g. 1024 -> 1 KB)
export function formatBytes(bytes: number | null): string {
  if (bytes === null || bytes === undefined) return ''
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

// Utility to format Last Modified date/time according to rules:
// - Today: Only time in 12-hour format (e.g. "08:15 AM")
// - Current Year: Day-Month Time (e.g. "29-Aug 12:00 PM")
// - Other Years: Day-Month-Year Time (e.g. "15-Nov-2025 06:30 PM")
export function formatLastModified(updatedAtStr: string): string {
  if (!updatedAtStr) return ''

  // Ensure UTC string is parsed explicitly as UTC so Date object methods return local timezone
  let isoStr = updatedAtStr.trim()
  if (!isoStr.includes('T')) {
    isoStr = isoStr.replace(' ', 'T')
  }
  if (!isoStr.endsWith('Z') && !/[+-]\d{2}:?\d{2}$/.test(isoStr)) {
    isoStr += 'Z'
  }

  const dateObj = new Date(isoStr)
  if (isNaN(dateObj.getTime())) return updatedAtStr

  const now = new Date()

  const isToday =
    dateObj.getFullYear() === now.getFullYear() &&
    dateObj.getMonth() === now.getMonth() &&
    dateObj.getDate() === now.getDate()

  const isCurrentYear = dateObj.getFullYear() === now.getFullYear()

  // Format 12-hour time (e.g. "02:30 PM")
  let hours = dateObj.getHours()
  const minutes = dateObj.getMinutes().toString().padStart(2, '0')
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12
  hours = hours ? hours : 12
  const hoursStr = hours.toString().padStart(2, '0')
  const timeStr = `${hoursStr}:${minutes} ${ampm}`

  if (isToday) {
    return timeStr
  }

  const dayStr = dateObj.getDate().toString().padStart(2, '0')
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const monthStr = monthNames[dateObj.getMonth()]

  if (isCurrentYear) {
    return `${dayStr}-${monthStr} ${timeStr}`
  }

  const yearStr = dateObj.getFullYear()
  return `${dayStr}-${monthStr}-${yearStr} ${timeStr}`
}

/**
 * Utility to extract user-friendly error messages from HTTP 4xx/5xx error responses.
 * Handles simple error responses ({ message: "..." }) and field validation errors ({ reasons: { field: "error" } }).
 */
export function getErrorMessage(err: any, fallbackMessage: string = 'An error occurred'): string {
  if (!err) return fallbackMessage

  // Check for network connectivity or server offline errors
  if (!err.response || err.code === 'ERR_NETWORK' || err.message === 'Network Error' || err.message?.includes('Network')) {
    return 'Failed to connect to server'
  }

  const data = err.response?.data

  if (data && typeof data === 'object') {
    // 1. Check for field validation reasons ({ reasons: { <key>: <value> } })
    if (data.reasons && typeof data.reasons === 'object' && !Array.isArray(data.reasons)) {
      const entries = Object.entries(data.reasons)
      if (entries.length > 0) {
        return entries
          .map(([key, value]) => (key ? `${key}: ${value}` : String(value)))
          .join('; ')
      }
    }

    // 2. Check for simple message string ({ message: "..." })
    if (typeof data.message === 'string' && data.message.trim() !== '') {
      return data.message
    }
  } else if (typeof data === 'string' && data.trim() !== '') {
    return data
  }

  return err.message || fallbackMessage
}

// export function isValidEmail(value: string): boolean {

// }

// export function isValidPassword(value: string): boolean {

// }