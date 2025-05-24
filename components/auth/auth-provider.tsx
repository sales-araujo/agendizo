"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/auth-helpers-nextjs"

type AuthContextType = {
  user: User | null
  isLoading: boolean
  signUp: (
    email: string,
    password: string,
    fullName: string,
    metadata?: {
      slug?: string
      category?: string
      phone?: string
    },
  ) => Promise<{ error: Error | null }>
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      setIsLoading(false)
    }

    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user)
      } else {
        setUser(null)
      }
      setIsLoading(false)
      router.refresh()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase])

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    metadata?: {
      slug?: string
      category?: string
      phone?: string
    },
  ) => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          fullName,
          metadata,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao registrar usuário")
      }

      return { error: null }
    } catch (error) {
      console.error("Error in signUp:", error)
      return { error: error as Error }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao fazer login")
      }

      return { error: null }
    } catch (error) {
      console.error("Error in signIn:", error)
      return { error: error as Error }
    }
  }

  const signOut = async () => {
    try {
      // Limpa o tema do dashboard antes de fazer logout
      const root = window.document.documentElement
      root.classList.remove("light", "dark")
      root.classList.add("light") // Força o tema claro na home

      // Limpa o estado local
      setUser(null)
      setIsLoading(true)

      // Faz logout no Supabase
      await supabase.auth.signOut()

      // Força um recarregamento completo da página
      window.location.href = "/"
    } catch (error) {
      console.error("Error signing out:", error)
      // Mesmo com erro, força o redirecionamento
      window.location.href = "/"
    }
  }

  const value = {
    user,
    isLoading,
    signUp,
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
