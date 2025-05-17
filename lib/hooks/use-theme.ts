import { useEffect } from "react"
import { useSettings } from "@/lib/contexts/settings-context"

export function useTheme() {
  const { settings } = useSettings()

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove("light", "dark")

    if (settings.theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      root.classList.add(systemTheme)
    } else {
      root.classList.add(settings.theme)
    }
  }, [settings.theme])

  return { theme: settings.theme }
} 