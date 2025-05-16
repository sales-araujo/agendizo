"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth/auth-provider"
import { ExternalLink } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/theme-toggle"

interface DashboardHeaderProps {
  children?: React.ReactNode
}

export function DashboardHeader({ children }: DashboardHeaderProps) {
  const [businessSlug, setBusinessSlug] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const fetchBusinessSlug = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase
          .from("businesses")
          .select("slug")
          .eq("owner_id", user.id)
          .limit(1)
          .single()

        if (!error && data) {
          setBusinessSlug(data.slug)
        }
      } catch (error) {
        console.error("Erro ao buscar slug do negócio:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchBusinessSlug()
    }
  }, [user, supabase])

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
      <div className="flex flex-1 items-center gap-4">{children}</div>
      <div className="flex items-center gap-4">
        {!isLoading && businessSlug && (
          <Button variant="outline" size="sm" asChild className="hidden md:flex">
            <Link href={`/${businessSlug}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Ver página
            </Link>
          </Button>
        )}
        <ModeToggle />
      </div>
    </header>
  )
}
