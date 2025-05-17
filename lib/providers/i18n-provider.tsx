"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useSettings } from "@/lib/contexts/settings-context"
import { translations } from "@/lib/i18n/translations"

type TranslationKey = string
type TranslationValue = string | Record<string, any>

interface I18nContextType {
  t: (key: TranslationKey) => string
  currentLanguage: string
  formatCurrency: (value: number) => string
  formatDate: (date: Date | string, format?: string) => string
  formatTime: (date: Date | string) => string
  formatDateTime: (date: Date | string) => string
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings()
  const [currentLanguage, setCurrentLanguage] = useState(settings.language)

  useEffect(() => {
    setCurrentLanguage(settings.language)
    document.documentElement.lang = settings.language
  }, [settings.language])

  const t = (key: TranslationKey): string => {
    try {
      const keys = key.split(".")
      let value: TranslationValue = translations[currentLanguage as keyof typeof translations] || translations["pt-BR"]

      for (const k of keys) {
        if (value && typeof value === "object" && k in value) {
          value = value[k]
        } else {
          console.warn(`Translation key not found: ${key}`)
          return key
        }
      }

      if (typeof value !== "string") {
        console.warn(`Invalid translation value for key: ${key}`)
        return key
      }

      return value
    } catch (error) {
      console.error(`Error translating key: ${key}`, error)
      return key
    }
  }

  const formatCurrency = (value: number): string => {
    const currencyFormats = {
      BRL: { locale: "pt-BR", currency: "BRL" },
      USD: { locale: "en-US", currency: "USD" },
      EUR: { locale: "es-ES", currency: "EUR" },
    }

    const format = currencyFormats[settings.currency as keyof typeof currencyFormats] || currencyFormats.BRL

    return new Intl.NumberFormat(format.locale, {
      style: "currency",
      currency: format.currency,
    }).format(value)
  }

  const formatDate = (date: Date | string, format: string = "PP"): string => {
    const dateObj = typeof date === "string" ? new Date(date) : date
    return new Intl.DateTimeFormat(currentLanguage, {
      dateStyle: "long",
    }).format(dateObj)
  }

  const formatTime = (date: Date | string): string => {
    const dateObj = typeof date === "string" ? new Date(date) : date
    return new Intl.DateTimeFormat(currentLanguage, {
      timeStyle: "short",
    }).format(dateObj)
  }

  const formatDateTime = (date: Date | string): string => {
    const dateObj = typeof date === "string" ? new Date(date) : date
    return new Intl.DateTimeFormat(currentLanguage, {
      dateStyle: "long",
      timeStyle: "short",
    }).format(dateObj)
  }

  return (
    <I18nContext.Provider
      value={{
        t,
        currentLanguage,
        formatCurrency,
        formatDate,
        formatTime,
        formatDateTime,
      }}
    >
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider")
  }
  return context
} 