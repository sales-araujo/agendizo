"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Menu, ExternalLink } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import { createClient } from "@/lib/supabase/client"

import { Button } from "@/components/ui/button"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { ModeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"

interface DashboardShellProps {
  children: React.ReactNode
}

// Definindo os tipos para os subcomponentes
interface HeaderProps {
  children: React.ReactNode
}

interface TitleProps {
  children: React.ReactNode
}

interface DescriptionProps {
  children: React.ReactNode
}

interface ContentProps {
  children: React.ReactNode
}

// Criando os subcomponentes
function DashboardShellHeader({ children }: HeaderProps) {
  return <div className="flex flex-col gap-2 mb-6">{children}</div>
}

function DashboardShellTitle({ children }: TitleProps) {
  return <h1 className="text-2xl font-bold">{children}</h1>
}

function DashboardShellDescription({ children }: DescriptionProps) {
  return <p className="text-muted-foreground">{children}</p>
}

function DashboardShellContent({ children }: ContentProps) {
  return <div className="space-y-6">{children}</div>
}

export function DashboardShell({ children }: DashboardShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [businessSlug, setBusinessSlug] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()
  const supabase = createClient()
  const pathname = usePathname()

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

  // Escutar eventos de toggle do sidebar
  useEffect(() => {
    const handleSidebarToggle = (event: CustomEvent) => {
      setIsSidebarOpen(!event.detail.isCollapsed)
    }

    window.addEventListener('sidebar-toggle' as any, handleSidebarToggle)

    return () => {
      window.removeEventListener('sidebar-toggle' as any, handleSidebarToggle)
    }
  }, [])

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className={cn(
        "flex-1 min-h-screen transition-all duration-300 ease-in-out",
        isSidebarOpen 
          ? "lg:ml-[250px] md:ml-[70px]" 
          : "lg:ml-[70px] md:ml-0",
        "ml-0"
      )}>
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background px-4">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden" 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <Menu className="h-6 w-6" />
              <span className="sr-only">Abrir menu</span>
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {!isLoading && businessSlug && (
              <Button className="bg-[#eb07a4] hover:bg-[#d0069a] text-white" size="sm" asChild>
                <Link href={`/${businessSlug}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Ver página
                </Link>
              </Button>
            )}
            <ModeToggle />
          </div>
        </header>
        <main className="w-full min-h-[calc(100vh-4rem)]">
          <div className="w-full h-full p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

// Anexar os subcomponentes ao componente principal
DashboardShell.Header = DashboardShellHeader
DashboardShell.Title = DashboardShellTitle
DashboardShell.Description = DashboardShellDescription
DashboardShell.Content = DashboardShellContent
