"use client"

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AuthCheck() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) {
        console.error('Erro ao verificar autenticação:', error)
        setError(error.message)
        setIsAuthenticated(false)
        return
      }

      setIsAuthenticated(!!user)
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error)
      setError(error instanceof Error ? error.message : 'Erro desconhecido')
      setIsAuthenticated(false)
    }
  }

  if (isAuthenticated === null) {
    return null
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Não autenticado</AlertTitle>
          <AlertDescription>
            {error || 'Você precisa estar autenticado para acessar esta página.'}
          </AlertDescription>
        </Alert>
        <Button 
          className="mt-4"
          onClick={() => {
            window.location.href = '/login'
          }}
        >
          Ir para o login
        </Button>
      </div>
    )
  }

  return null
} 