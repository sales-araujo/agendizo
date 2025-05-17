import { format, formatRelative } from "date-fns"
import { ptBR, enUS, es } from "date-fns/locale"
import { useSettings } from "@/lib/contexts/settings-context"

export function useDateFormat() {
  const { settings } = useSettings()

  const locales = {
    "pt-BR": ptBR,
    "en": enUS,
    "es": es,
  }

  const locale = locales[settings.language as keyof typeof locales] || locales["pt-BR"]

  const formatDate = (date: Date | string, formatString: string = "PPP") => {
    const dateObj = typeof date === "string" ? new Date(date) : date
    return format(dateObj, formatString, { locale })
  }

  const formatRelativeDate = (date: Date | string, baseDate: Date = new Date()) => {
    const dateObj = typeof date === "string" ? new Date(date) : date
    return formatRelative(dateObj, baseDate, { locale })
  }

  const formatTime = (date: Date | string) => {
    const dateObj = typeof date === "string" ? new Date(date) : date
    return format(dateObj, "p", { locale })
  }

  const formatDateTime = (date: Date | string) => {
    const dateObj = typeof date === "string" ? new Date(date) : date
    return format(dateObj, "PPp", { locale })
  }

  return {
    formatDate,
    formatRelativeDate,
    formatTime,
    formatDateTime,
  }
} 