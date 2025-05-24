'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { type Business } from '@/lib/types'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function HeaderBusinessSelector() {
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | undefined>(
    searchParams.get('business_id') || undefined
  )
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id || null)
    }
    getUser()
  }, [supabase.auth])

  useEffect(() => {
    if (!userId) {
      setIsLoading(false)
      if (pathname.startsWith('/dashboard')) {
      }
      return
    }

    const fetchBusinesses = async () => {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('businesses')
        .select('id, name, slug, owner_id, created_at, updated_at')
        .eq('owner_id', userId)

      if (error) {
        toast.error('Erro ao buscar negócios', {
          description: error.message,
        })
        setBusinesses([])
      } else {
        setBusinesses(data || [])
        const currentBusinessId = searchParams.get('business_id')
        if (!currentBusinessId && data && data.length > 0) {
          setSelectedBusinessId(data[0].id)
          const current = new URLSearchParams(Array.from(searchParams.entries()))
          current.set('business_id', data[0].id)
          router.replace(`${pathname}?${current.toString()}`, { scroll: false })
        } else if (currentBusinessId) {
          setSelectedBusinessId(currentBusinessId)
        } else if (data && data.length === 0) {
            setSelectedBusinessId(undefined)
        }
      }
      setIsLoading(false)
    }

    fetchBusinesses()
  }, [userId, supabase, pathname, router, searchParams])

  useEffect(() => {
    const newBusinessId = searchParams.get('business_id')
    if (newBusinessId) {
        setSelectedBusinessId(newBusinessId)
    } else if (businesses.length > 0 && !newBusinessId) {
        setSelectedBusinessId(undefined)
    }
  }, [searchParams, businesses])

  const handleBusinessChange = (businessId: string) => {
    if (businessId === 'add_new_business') {
        router.push('/dashboard/negocios/novo')
        return
    }
    setSelectedBusinessId(businessId)
    const current = new URLSearchParams(Array.from(searchParams.entries()))
    current.set('business_id', businessId)
    router.push(`${pathname}?${current.toString()}`, { scroll: false })
  }

  if (isLoading && pathname.startsWith('/dashboard')) {
    return <Skeleton className="h-10 w-48" />
  }

  if (!userId && pathname.startsWith('/dashboard')) {
    return null
  }

  if (businesses.length === 0 && !isLoading && pathname.startsWith('/dashboard')) {
    return (
      <Button variant="outline" asChild>
        <Link href="/dashboard/negocios/novo">Criar Negócio</Link>
      </Button>
    )
  }
  
  if (!pathname.startsWith('/dashboard')) {
    return null
  }

  return (
    <div className="w-48">
      <Select
        value={selectedBusinessId || ''}
        onValueChange={handleBusinessChange}
        disabled={businesses.length === 0 && !isLoading}
      >
        <SelectTrigger className="overflow-hidden text-ellipsis whitespace-nowrap">
          <SelectValue placeholder="Selecione um negócio" />
        </SelectTrigger>
        <SelectContent>
          {businesses.map((business) => (
            <SelectItem key={business.id} value={business.id} className="overflow-hidden text-ellipsis whitespace-nowrap">
              {business.name}
            </SelectItem>
          ))}
           <SelectItem value="add_new_business" className="mt-2 border-t pt-2 text-primary">
            + Adicionar Novo Negócio
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
