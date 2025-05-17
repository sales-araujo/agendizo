import { useSettings } from "@/lib/contexts/settings-context"

export function useCurrency() {
  const { settings } = useSettings()

  const formatCurrency = (value: number) => {
    const currencyFormats = {
      BRL: {
        locale: "pt-BR",
        currency: "BRL",
      },
      USD: {
        locale: "en-US",
        currency: "USD",
      },
      EUR: {
        locale: "de-DE",
        currency: "EUR",
      },
    }

    const format = currencyFormats[settings.currency as keyof typeof currencyFormats] || currencyFormats.BRL

    return new Intl.NumberFormat(format.locale, {
      style: "currency",
      currency: format.currency,
    }).format(value)
  }

  return { formatCurrency }
} 