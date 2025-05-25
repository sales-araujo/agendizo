'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useSettings } from '@/lib/contexts/settings-context'
import { createClient } from '@/lib/supabase/client'

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

  const fetchData = useCallback(async () => {
    if (!selectedBusiness?.id) {
      setData([])
      setIsLoading(false)
      setError(null)
      return
    }
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
        if (typeof value === 'object' && value !== null) {
          Object.entries(value).forEach(([op, opValue]) => {
            if (op === 'gte') queryBuilder = queryBuilder.gte(key, opValue)
            else if (op === 'lte') queryBuilder = queryBuilder.lte(key, opValue)
            else if (op === 'gt') queryBuilder = queryBuilder.gt(key, opValue)
            else if (op === 'lt') queryBuilder = queryBuilder.lt(key, opValue)
            else if (op === 'neq') queryBuilder = queryBuilder.neq(key, opValue)
            // Adicione outros operadores se necessário
          })
        } else {
          queryBuilder = queryBuilder.eq(key, value)
        }
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
  }, [table, query, selectedBusiness?.id, transform, JSON.stringify(filters)])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const refresh = useCallback(async () => {
    await fetchData()
  }, [fetchData])

  return {
    data,
    isLoading,
    error,
    refresh
  }
} 