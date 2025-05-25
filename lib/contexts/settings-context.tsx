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
  const isInitialLoadRef = useRef(true)
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

      // Only select a business on initial load
      if (isInitialLoadRef.current && data && data.length > 0) {
        const savedBusinessId = localStorage.getItem('selectedBusinessId')
        const businessToSelect = savedBusinessId 
          ? data.find(b => b.id === savedBusinessId)
          : data[0]
        
        if (businessToSelect) {
          setSelectedBusiness(businessToSelect)
          localStorage.setItem('selectedBusinessId', businessToSelect.id)
          // Update URL with the selected business
          const params = new URLSearchParams(searchParams.toString())
          params.set('business_id', businessToSelect.id)
          router.replace(`${pathname}?${params.toString()}`)
        }
        isInitialLoadRef.current = false
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
  }, [user?.id, toast, searchParams, pathname, router])

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
    // Skip if selecting the same business
    if (businessId === prevBusinessIdRef.current) return

    const business = businesses.find(b => b.id === businessId)
    if (!business) {
      toast({
        title: 'Erro',
        description: 'Negócio não encontrado.',
        variant: 'destructive',
      })
      return
    }

    prevBusinessIdRef.current = businessId
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
  }, [loadBusinesses])

  // Handle business selection from URL
  useEffect(() => {
    const businessId = searchParams.get('business_id')
    if (businessId && businessId !== selectedBusiness?.id) {
      const business = businesses.find(b => b.id === businessId)
      if (business) {
        setSelectedBusiness(business)
        localStorage.setItem('selectedBusinessId', businessId)
        loadClients(businessId)
      }
    }
  }, [searchParams, selectedBusiness?.id, businesses, loadClients])

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