'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useSettings } from '@/lib/contexts/settings-context'
import { createClient } from '@/lib/supabase/client'
import { PostgrestError } from '@supabase/supabase-js'

interface UseBusinessDataOptions<T> {
  table: string
  query?: string
  transform?: (data: any) => T
  filters?: Record<string, any>
}

export function useBusinessData<T>({ table, query = '*', transform, filters = {} }: UseBusinessDataOptions<T>) {
  const [data, setData] = useState<T[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { selectedBusiness } = useSettings()
  const supabase = createClient()
  const abortControllerRef = useRef<AbortController | null>(null)
  const prevBusinessIdRef = useRef<string | null>(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      // Skip if no business is selected or if it's the same business
      if (!selectedBusiness?.id || selectedBusiness.id === prevBusinessIdRef.current) {
        return
      }

      // Update the previous business ID
      prevBusinessIdRef.current = selectedBusiness.id

      // Cancel any ongoing requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Create a new abort controller
      abortControllerRef.current = new AbortController()

      try {
        setIsLoading(true)
        setError(null)

        let queryBuilder = supabase
          .from(table)
          .select(query)
          .eq('business_id', selectedBusiness.id)

        // Apply additional filters
        Object.entries(filters).forEach(([key, value]) => {
          queryBuilder = queryBuilder.eq(key, value)
        })

        const { data: result, error: err } = await queryBuilder

        if (!isMountedRef.current) return

        if (err) {
          throw err
        }

        if (!result) {
          setData([])
          return
        }

        const transformedData = transform ? result.map(transform) : (result as T[])
        setData(transformedData)
      } catch (err) {
        if (!isMountedRef.current) return
        setError(err instanceof Error ? err : new Error('An error occurred'))
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false)
        }
      }
    }

    fetchData()
  }, [table, query, selectedBusiness?.id, transform, JSON.stringify(filters)])

  const refresh = async () => {
    if (!selectedBusiness?.id) return
    prevBusinessIdRef.current = null // Reset the previous business ID to force a refresh
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        let queryBuilder = supabase
          .from(table)
          .select(query)
          .eq('business_id', selectedBusiness.id)

        Object.entries(filters).forEach(([key, value]) => {
          queryBuilder = queryBuilder.eq(key, value)
        })

        const { data: result, error: err } = await queryBuilder

        if (!isMountedRef.current) return

        if (err) {
          throw err
        }

        if (!result) {
          setData([])
          return
        }

        const transformedData = transform ? result.map(transform) : (result as T[])
        setData(transformedData)
      } catch (err) {
        if (!isMountedRef.current) return
        setError(err instanceof Error ? err : new Error('An error occurred'))
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false)
        }
      }
    }

    await fetchData()
  }

  return { data, isLoading, error, refresh }
} 