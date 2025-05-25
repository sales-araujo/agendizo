import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Business } from '@/lib/types/business'

export function useBusinesses() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function fetchBusinesses() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
          .from('businesses')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error

        setBusinesses(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar negócios')
      } finally {
        setIsLoading(false)
      }
    }

    fetchBusinesses()
  }, [])

  return { businesses, isLoading, error }
} 