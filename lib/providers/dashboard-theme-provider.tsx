"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth/auth-provider"
import { useToast } from "@/components/ui/use-toast"

interface ThemeContextType {
  theme: string
  setTheme: (theme: string) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function DashboardThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState("light")
  const { user } = useAuth()
  const supabase = createClient()
  const { toast } = useToast()

  // Carregar tema inicial
  useEffect(() => {
    if (user) {
      loadTheme()
    }
  }, [user])

  // Aplicar tema
  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove("light", "dark")

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }
  }, [theme])

  const loadTheme = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("dashboard_theme_settings")
        .select("theme")
        .eq("user_id", user.id)
        .single()

      if (error) {
        if (error.code === "PGRST116") {
          // Se não existir configuração, cria uma nova
          await createThemeSettings()
        } else {
          throw error
        }
      } else if (data) {
        setTheme(data.theme)
      }
    } catch (error) {
      console.error("Error loading theme:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar suas configurações de tema",
        variant: "destructive",
      })
    }
  }

  const createThemeSettings = async () => {
    if (!user) return

    try {
      const { error } = await supabase
        .from("dashboard_theme_settings")
        .insert([{
          user_id: user.id,
          theme: "light",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])

      if (error) throw error
    } catch (error) {
      console.error("Error creating theme settings:", error)
      toast({
        title: "Erro",
        description: "Não foi possível criar suas configurações de tema",
        variant: "destructive",
      })
    }
  }

  const handleThemeChange = async (newTheme: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from("dashboard_theme_settings")
        .upsert({
          user_id: user.id,
          theme: newTheme,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        })

      if (error) throw error

      setTheme(newTheme)
    } catch (error) {
      console.error("Error updating theme:", error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar seu tema",
        variant: "destructive",
      })
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleThemeChange }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useDashboardTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useDashboardTheme must be used within a DashboardThemeProvider")
  }
  return context
} 