"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth/auth-provider"
import type { Business } from "@/lib/types"
import { useToast } from "@/components/ui/use-toast"

interface Settings {
  currency: string
  theme: string
  timeZone: string
  businessId?: string
}

interface SettingsContextType {
  settings: Settings
  businesses: Business[]
  selectedBusiness: Business | null
  isLoading: boolean
  updateSettings: (settings: Partial<Settings>) => Promise<void>
  selectBusiness: (businessId: string) => Promise<void>
}

const defaultSettings: Settings = {
  currency: "BRL",
  theme: "light",
  timeZone: "America/Sao_Paulo",
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    if (user) {
      loadBusinesses()
    } else {
      setIsLoading(false)
      setSettings(defaultSettings)
      setBusinesses([])
      setSelectedBusiness(null)
    }
  }, [user])

  const loadBusinesses = async () => {
    try {
      setIsLoading(true)
      const { data: businessData, error: businessError } = await supabase
        .from("businesses")
        .select("*")
        .eq("owner_id", user?.id)
        .order("name")

      if (businessError) throw businessError

      const businesses = businessData || []
      setBusinesses(businesses)

      // Sempre seleciona a primeira loja se existir
      if (businesses.length > 0) {
        const firstBusiness = businesses[0]
        setSelectedBusiness(firstBusiness)
        // Carrega as configurações silenciosamente (sem toast)
        await loadSettings(firstBusiness.id, true)
      } else {
        setSettings(defaultSettings)
        setSelectedBusiness(null)
      }
    } catch (error) {
      console.error("Error loading businesses:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar seus negócios",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadSettings = async (businessId: string, silent: boolean = false) => {
    if (!businessId || !user?.id) {
      console.error("Missing businessId or user_id")
      return
    }

    try {
      const { data: settingsData, error: settingsError } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .eq("business_id", businessId)
        .maybeSingle()

      if (settingsError) throw settingsError

      let newSettings: Settings;

      if (settingsData) {
        newSettings = {
          currency: settingsData.currency || defaultSettings.currency,
          theme: settingsData.theme || defaultSettings.theme,
          timeZone: settingsData.time_zone || defaultSettings.timeZone,
          businessId,
        }
      } else {
        // Criar novas configurações
        newSettings = { ...defaultSettings, businessId }
        const { error: createError } = await supabase
          .from("user_settings")
          .insert([{
            user_id: user.id,
            business_id: businessId,
            currency: defaultSettings.currency,
            theme: defaultSettings.theme,
            time_zone: defaultSettings.timeZone,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }])
          .select()
          .single()

        if (createError) throw createError
      }

      setSettings(newSettings)
      applySettings(newSettings)

      // Só mostra o toast se não estiver em modo silencioso
      if (!silent) {
        toast({
          title: "Sucesso",
          description: "Configurações do negócio carregadas com sucesso",
          variant: "success",
        })
      }
    } catch (error: any) {
      console.error("Error loading settings:", error)
      
      // Só mostra o toast de erro se não estiver em modo silencioso
      if (!silent) {
        toast({
          title: "Erro",
          description: "Não foi possível carregar suas configurações",
          variant: "destructive",
        })
      }
      
      // Em caso de erro, usar configurações padrão com o businessId
      const defaultWithBusiness = { ...defaultSettings, businessId }
      setSettings(defaultWithBusiness)
      applySettings(defaultWithBusiness)
    }
  }

  const applySettings = (newSettings: Settings) => {
    // Atualizar o tema do sistema
    const root = window.document.documentElement
    root.classList.remove("light", "dark")
    if (newSettings.theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      root.classList.add(systemTheme)
    } else {
      root.classList.add(newSettings.theme)
    }
  }

  const selectBusiness = async (businessId: string) => {
    try {
      setIsLoading(true)
      const business = businesses.find((b) => b.id === businessId)
      if (business) {
        setSelectedBusiness(business)
        await loadSettings(businessId)
      } else {
        throw new Error("Negócio não encontrado")
      }
    } catch (error) {
      console.error("Error selecting business:", error)
      toast({
        title: "Erro",
        description: "Não foi possível selecionar o negócio",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updateSettings = async (newSettings: Partial<Settings>) => {
    if (!user?.id || !settings.businessId) {
      toast({
        title: "Erro",
        description: "Selecione um negócio antes de atualizar as configurações",
        variant: "destructive",
      })
      return
    }

    // Verifica se houve mudança real nas configurações
    const hasChanges = Object.entries(newSettings).some(
      ([key, value]) => settings[key as keyof Settings] !== value
    )

    if (!hasChanges) {
      return // Se não houve mudanças, não faz nada
    }

    try {
      const updatedSettings = { ...settings, ...newSettings }
      
      // Primeiro aplica as configurações localmente
      setSettings(updatedSettings)
      applySettings(updatedSettings)

      // Depois tenta persistir no banco
      const { error } = await supabase
        .from("user_settings")
        .update({
          currency: updatedSettings.currency,
          theme: updatedSettings.theme,
          time_zone: updatedSettings.timeZone,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .eq("business_id", settings.businessId)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Suas configurações foram atualizadas",
        variant: "success",
      })
    } catch (error) {
      console.error("Error updating settings:", error)
      toast({
        title: "Erro",
        description: "Não foi possível salvar suas configurações",
        variant: "destructive",
      })
      // Em caso de erro, recarrega as configurações do banco
      if (settings.businessId) {
        await loadSettings(settings.businessId)
      }
    }
  }

  return (
    <SettingsContext.Provider
      value={{
        settings,
        businesses,
        selectedBusiness,
        isLoading,
        updateSettings,
        selectBusiness,
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider")
  }
  return context
} 