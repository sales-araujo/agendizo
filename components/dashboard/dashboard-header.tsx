"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ExternalLink } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/theme-toggle"
import { HeaderBusinessSelector } from "@/components/dashboard/header-business-selector"
import { Skeleton } from "@/components/ui/skeleton"

interface DashboardHeaderProps {
  children?: React.ReactNode
}

export function DashboardHeader({ children }: DashboardHeaderProps) {
  const [currentBusinessSlug, setCurrentBusinessSlug] = useState<string | null>(null)
  const [isSlugLoading, setIsSlugLoading] = useState(false)
  const supabase = createClient()
  const searchParams = useSearchParams()

  useEffect(() => {
    const selectedBusinessId = searchParams.get("business_id")

    if (selectedBusinessId) {
      setIsSlugLoading(true)
      const fetchSlug = async () => {
        const { data, error } = await supabase
          .from("businesses")
          .select("slug")
          .eq("id", selectedBusinessId)
          .single()

        if (!error && data) {
          setCurrentBusinessSlug(data.slug)
        } else {
          setCurrentBusinessSlug(null)
          if (error) {
            console.error("Erro ao buscar slug do negócio selecionado:", error.message)
          }
        }
        setIsSlugLoading(false)
      }
      fetchSlug()
    } else {
      setCurrentBusinessSlug(null)
      setIsSlugLoading(false)
    }
  }, [searchParams, supabase])

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6">
      <div className="flex flex-1 items-center gap-2 sm:gap-4">
        {children}
        <HeaderBusinessSelector />
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        {isSlugLoading && <Skeleton className="h-9 w-32 rounded-md hidden md:flex" />}
        {!isSlugLoading && currentBusinessSlug && (
          <Button
            variant="outline"
            size="sm"
            asChild
            className="hidden md:flex bg-[#eb07a4] text-white hover:bg-[#d0069a]"
          >
            <Link
              href={`/${currentBusinessSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <ExternalLink className="mr-1 h-4 w-4" />
              Ver página
            </Link>
          </Button>
        )}
        <ModeToggle />
      </div>
    </header>
  )
}
