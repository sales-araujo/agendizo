"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth/auth-provider"
import type { Business } from "@/lib/types"
import { useToast } from "@/components/ui/use-toast"

interface Settings {
  currency: string
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

  // Efeito para carregar as configurações quando o usuário fizer login
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
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("owner_id", user.id)

      if (error) throw error

      if (data && data.length > 0) {
        setBusinesses(data)
        setSelectedBusiness(data[0])
        await loadSettings(data[0].id)
      } else {
        setIsLoading(false)
      }
    } catch (error) {
      console.error("Error loading businesses:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar seus negócios",
        variant: "destructive",
      })
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
            time_zone: defaultSettings.timeZone,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }])
          .select()
          .single()

        if (createError) throw createError
      }

      setSettings(newSettings)

      // Só mostra o toast se não estiver em modo silencioso
      if (!silent) {
        toast({
          title: "Sucesso",
          description: "Configurações do negócio carregadas com sucesso",
          variant: "success",
        })
      }
    } catch (error) {
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
    }
  }

  const selectBusiness = async (businessId: string) => {
    const business = businesses.find((b) => b.id === businessId)
    if (business) {
      setSelectedBusiness(business)
      await loadSettings(businessId)
    }
  }

  const updateSettings = async (newSettings: Partial<Settings>) => {
    if (!user?.id || !settings.businessId) {
      console.error("Missing user_id or business_id")
      return
    }

    try {
      const updatedSettings = { ...settings, ...newSettings }
      
      // Primeiro tenta persistir no banco
      const { error } = await supabase
        .from("user_settings")
        .update({
          currency: updatedSettings.currency,
          time_zone: updatedSettings.timeZone,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .eq("business_id", settings.businessId)

      if (error) throw error

      // Se salvou no banco com sucesso, atualiza o estado local
      setSettings(updatedSettings)

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
      await loadSettings(settings.businessId, true)
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