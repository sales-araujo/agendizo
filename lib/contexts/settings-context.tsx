"use client"

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth/auth-provider"
import type { Business } from "@/lib/types"
import { useToast } from "@/components/ui/use-toast"
import { useSearchParams, usePathname, useRouter } from "next/navigation"

interface Client {
  id: string
  business_id: string
  name: string
  email?: string
  phone?: string
  notes?: string
  created_at: string
}

interface SettingsContextType {
  clients: Client[]
  businesses: Business[]
  selectedBusiness: Business | null
  isLoading: boolean
  selectBusiness: (businessId: string) => void
  refreshBusinessData: () => Promise<void>
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider")
  }
  return context
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [clients, setClients] = useState<Client[]>([])
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()
  const { toast } = useToast()
  const supabase = createClient()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const prevBusinessIdRef = useRef<string | null>(null)

  const loadBusinesses = useCallback(async () => {
    if (!user?.id) {
      setBusinesses([])
      setSelectedBusiness(null)
      setIsLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setBusinesses(data || [])

      if (data && data.length > 0) {
        // 1. Se já existe um negócio selecionado e ele está na lista, mantenha-o
        if (selectedBusiness && data.find(b => b.id === selectedBusiness.id)) {
          // Não faz nada, mantém o selecionado
        } else {
          // 2. Se houver business_id na URL e for válido, seleciona esse
          const params = new URLSearchParams(window.location.search)
          const businessIdFromUrl = params.get('business_id')
          const businessFromUrl = businessIdFromUrl ? data.find(b => b.id === businessIdFromUrl) : null
          if (businessFromUrl) {
            setSelectedBusiness(businessFromUrl)
            localStorage.setItem('selectedBusinessId', businessFromUrl.id)
          } else {
            // 3. Tente restaurar do localStorage
            const savedBusinessId = localStorage.getItem('selectedBusinessId')
            const businessToSelect = savedBusinessId
              ? data.find(b => b.id === savedBusinessId)
              : null
            if (businessToSelect) {
              setSelectedBusiness(businessToSelect)
              localStorage.setItem('selectedBusinessId', businessToSelect.id)
            } else {
              // 4. Se não houver nada, seleciona o primeiro
              setSelectedBusiness(data[0])
              localStorage.setItem('selectedBusinessId', data[0].id)
            }
          }
        }
      } else {
        setSelectedBusiness(null)
        localStorage.removeItem('selectedBusinessId')
      }
    } catch (error) {
      console.error('Error loading businesses:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os negócios.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [user?.id, toast, supabase])

  const loadClients = useCallback(async (businessId: string) => {
    if (!user?.id || !businessId) return

    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })

      if (error) throw error

      setClients(data || [])
    } catch (error) {
      console.error('Error loading clients:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os clientes.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [user?.id, toast])

  const selectBusiness = useCallback((businessId: string) => {
    const business = businesses.find(b => b.id === businessId)
    if (!business) {
      toast({
        title: 'Erro',
        description: 'Negócio não encontrado.',
        variant: 'destructive',
      })
      return
    }

    setSelectedBusiness(business)
    localStorage.setItem('selectedBusinessId', businessId)

    // Update URL with the selected business
    const params = new URLSearchParams(searchParams.toString())
    params.set('business_id', businessId)
    router.replace(`${pathname}?${params.toString()}`)
  }, [businesses, toast, searchParams, pathname, router])

  const refreshBusinessData = useCallback(async () => {
    await loadBusinesses()
    if (selectedBusiness) {
      await loadClients(selectedBusiness.id)
    }
  }, [loadBusinesses, loadClients, selectedBusiness])

  // Load businesses when user changes
  useEffect(() => {
    loadBusinesses()
  }, [user?.id, loadBusinesses])

  // Garante que sempre tenha business_id na URL se houver selectedBusiness
  useEffect(() => {
    if (selectedBusiness && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const isDashboard = pathname.startsWith('/dashboard')
      
      if (isDashboard && !params.get('business_id')) {
        params.set('business_id', selectedBusiness.id)
        router.replace(`${pathname}?${params.toString()}`)
      } else if (!isDashboard && params.get('business_id')) {
        params.delete('business_id')
        router.replace(`${pathname}?${params.toString()}`)
      }
    }
  }, [selectedBusiness, pathname, router])

  return (
    <SettingsContext.Provider
      value={{
        clients,
        businesses,
        selectedBusiness,
        isLoading,
        selectBusiness,
        refreshBusinessData,
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
} 