import { useSettings } from "@/lib/contexts/settings-context"

export function useTimezone() {
  const { settings } = useSettings()

  const convertToUserTimezone = (date: Date | string) => {
    const dateObj = typeof date === "string" ? new Date(date) : date
    return new Date(
      dateObj.toLocaleString("en-US", {
        timeZone: settings.timeZone,
      }),
    )
  }

  const convertFromUserTimezone = (date: Date | string) => {
    const dateObj = typeof date === "string" ? new Date(date) : date
    const userDate = new Date(
      dateObj.toLocaleString("en-US", {
        timeZone: settings.timeZone,
      }),
    )
    const offset = dateObj.getTime() - userDate.getTime()
    return new Date(dateObj.getTime() + offset)
  }

  return {
    convertToUserTimezone,
    convertFromUserTimezone,
    timezone: settings.timeZone,
  }
} 