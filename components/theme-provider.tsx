"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"
import { usePathname } from "next/navigation"

// Provider específico para o dashboard
function DashboardThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="dashboard-theme"
    >
      {children}
    </NextThemesProvider>
  )
}

// Provider para o resto do site (sempre tema claro)
function SiteThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Efeito para forçar tema claro e limpar tema do dashboard
  React.useEffect(() => {
    // Limpa o localStorage do tema do dashboard
    localStorage.removeItem('dashboard-theme')
    localStorage.removeItem('theme')

    // Força tema claro
    document.documentElement.classList.remove('dark')
    document.documentElement.classList.add('light')
    document.documentElement.setAttribute('data-theme', 'light')
  }, [pathname])

  return <>{children}</>
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const pathname = usePathname()
  const isDashboard = pathname.startsWith('/dashboard')
  const [mounted, setMounted] = React.useState(false)

  // Efeito para montagem inicial
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Efeito para gerenciar o tema baseado na rota
  React.useEffect(() => {
    if (!isDashboard) {
      // Limpa o localStorage do tema do dashboard
      localStorage.removeItem('dashboard-theme')
      localStorage.removeItem('theme')

      // Força tema claro
      document.documentElement.classList.remove('dark')
      document.documentElement.classList.add('light')
      document.documentElement.setAttribute('data-theme', 'light')
    }
  }, [isDashboard])

  if (!mounted) {
    return null
  }

  // Se estiver no dashboard, usa o DashboardThemeProvider
  if (isDashboard) {
    return <DashboardThemeProvider>{children}</DashboardThemeProvider>
  }

  // Fora do dashboard, usa o SiteThemeProvider
  return <SiteThemeProvider>{children}</SiteThemeProvider>
} 