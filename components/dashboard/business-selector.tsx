import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useBusinesses } from '@/lib/hooks/use-businesses'
import type { Business } from '@/lib/types/business'

export function BusinessSelector() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { businesses, isLoading, error } = useBusinesses()

  // Função para atualizar a URL sem adicionar ao histórico
  const updateUrl = useCallback((params: URLSearchParams) => {
    const newUrl = pathname + (params.toString() ? `?${params.toString()}` : '')
    router.replace(newUrl, { scroll: false })
  }, [pathname, router])

  // Função para salvar business_id no cookie
  const saveBusinessIdToCookie = useCallback((businessId: string) => {
    document.cookie = `business_id=${businessId}; path=/; max-age=86400`
  }, [])

  // Função para obter business_id do cookie
  const getBusinessIdFromCookie = useCallback(() => {
    return document.cookie
      .split('; ')
      .find(row => row.startsWith('business_id='))
      ?.split('=')[1]
  }, [])

  const handleBusinessChange = (businessId: string) => {
    // Sempre salva no cookie primeiro
    saveBusinessIdToCookie(businessId)

    // Só atualiza a URL se estiver no dashboard
    if (pathname.startsWith('/dashboard')) {
      const params = new URLSearchParams(searchParams.toString())
      params.set('business_id', businessId)
      updateUrl(params)
    }
  }

  // Efeito para gerenciar o business_id na URL
  useEffect(() => {
    const isDashboard = pathname.startsWith('/dashboard')
    const params = new URLSearchParams(searchParams.toString())
    const hasBusinessId = params.has('business_id')
    const cookieBusinessId = getBusinessIdFromCookie()

    if (isDashboard) {
      // Se estiver no dashboard e não tiver business_id na URL
      if (!hasBusinessId && cookieBusinessId) {
        params.set('business_id', cookieBusinessId)
        updateUrl(params)
      }
    } else {
      // Se não estiver no dashboard e tiver business_id na URL
      if (hasBusinessId) {
        params.delete('business_id')
        updateUrl(params)
      }
    }
  }, [pathname, searchParams, updateUrl, getBusinessIdFromCookie])

  // Efeito para garantir que business_id seja removido ao montar o componente
  useEffect(() => {
    const isDashboard = pathname.startsWith('/dashboard')
    if (!isDashboard) {
      const params = new URLSearchParams(searchParams.toString())
      if (params.has('business_id')) {
        params.delete('business_id')
        updateUrl(params)
      }
    }
  }, [pathname, searchParams, updateUrl])

  if (isLoading) {
    return <Button variant="outline" disabled>Carregando...</Button>
  }

  if (error) {
    return <Button variant="outline" disabled>Erro ao carregar</Button>
  }

  return (
    <Select
      defaultValue={searchParams.get('business_id') || ''}
      onValueChange={handleBusinessChange}
    >
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Selecione um negócio" />
      </SelectTrigger>
      <SelectContent>
        {businesses?.map((business: Business) => (
          <SelectItem key={business.id} value={business.id}>
            {business.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
} 