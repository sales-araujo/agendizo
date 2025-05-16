"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart,
  Calendar,
  Users,
  Scissors,
  Store,
  Clock,
  Bell,
  Settings,
  LogOut,
  User,
  CreditCard,
  MessageSquare,
  ChevronLeft,
  Star,
  Code,
  QrCode,
  CalendarDays,
} from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

// Definir tipos para o perfil do usuário
interface UserProfile {
  id: string
  full_name?: string
  avatar_url?: string
  [key: string]: any
}

// Definir tipos para o negócio
interface Business {
  id: string
  name: string
  [key: string]: any
}

// Definir tipos para feedback
interface Feedback {
  rating: number
}

interface DashboardSidebarProps {
  isOpen?: boolean
  onClose?: () => void
  className?: string
}

export function DashboardSidebar({ isOpen, onClose, className }: DashboardSidebarProps) {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [businessRating, setBusinessRating] = useState(0)
  const supabase = createClient()

  const toggleSidebar = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem("sidebar-collapsed", newState ? "true" : "false")
    
    // Dispatch custom event for sidebar toggle
    const event = new CustomEvent('sidebar-toggle', {
      detail: { isCollapsed: newState }
    })
    window.dispatchEvent(event)
  }

  useEffect(() => {
    setMounted(true)

    // Verificar preferência do usuário para o estado do sidebar
    const savedState = localStorage.getItem("sidebar-collapsed")
    if (savedState) {
      const isCollapsed = savedState === "true"
      setIsCollapsed(isCollapsed)
      // Dispatch initial state
      const event = new CustomEvent('sidebar-toggle', {
        detail: { isCollapsed }
      })
      window.dispatchEvent(event)
    }

    // Verificar tamanho da tela para colapsar automaticamente em telas menores
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsCollapsed(true)
        const event = new CustomEvent('sidebar-toggle', {
          detail: { isCollapsed: true }
        })
        window.dispatchEvent(event)
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  // Carregar perfil do usuário quando o componente montar ou quando o usuário mudar
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        try {
          const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

          if (error) {
            console.error("Erro ao buscar perfil:", error)
            // Se não encontrar o perfil, usar os dados do user_metadata
            setUserProfile({
              id: user.id,
              full_name: user.user_metadata?.full_name || "Usuário",
              avatar_url: user.user_metadata?.avatar_url || null,
            })
            return
          }

          if (data) {
            setUserProfile(data as UserProfile)
          }
        } catch (error) {
          console.error("Erro ao buscar perfil:", error)
        }
      }
    }

    fetchUserProfile()
  }, [user, supabase])

  // Função para obter as iniciais do nome do usuário
  const getUserInitials = () => {
    const fullName = userProfile?.full_name || user?.user_metadata?.full_name || "U"
    const names = fullName.split(" ")

    if (names.length === 1) return names[0].charAt(0).toUpperCase()

    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase()
  }

  // Função para renderizar estrelas
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {Array(5)
          .fill(0)
          .map((_, i) => (
            <Star
              key={i}
              className={`h-3 w-3 ${
                i < Math.floor(rating)
                  ? "text-yellow-400 fill-yellow-400"
                  : i < rating
                    ? "text-yellow-400 fill-yellow-400 opacity-50"
                    : "text-gray-300"
              }`}
            />
          ))}
        <span className="text-xs ml-1 text-muted-foreground">{rating.toFixed(1)}</span>
      </div>
    )
  }

  // Função para verificar se um item está ativo
  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard"
    }
    return pathname?.startsWith(href) && href !== "/dashboard"
  }

  const navItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: BarChart,
    },
    {
      title: "Agendamentos",
      href: "/dashboard/agendamentos",
      icon: Calendar,
    },
    {
      title: "Clientes",
      href: "/dashboard/clientes",
      icon: Users,
    },
    {
      title: "Serviços",
      href: "/dashboard/servicos",
      icon: Scissors,
    },
    {
      title: "Negócios",
      href: "/dashboard/negocios",
      icon: Store,
    },
    {
      title: "Horários",
      href: "/dashboard/horarios",
      icon: Clock,
    },
    {
      title: "Feriados",
      href: "/dashboard/feriados",
      icon: CalendarDays,
    },
    {
      title: "Feedbacks",
      href: "/dashboard/feedbacks",
      icon: MessageSquare,
    },
    {
      title: "Notificações",
      href: "/dashboard/notificacoes",
      icon: Bell,
    },
    {
      title: "Configurações",
      href: "/dashboard/configuracoes",
      icon: Settings,
    },
  ]

  const bottomNavItems = [
    {
      title: "Meu Perfil",
      href: "/dashboard/perfil",
      icon: User,
    },
    {
      title: "Assinatura",
      href: "/dashboard/assinatura",
      icon: CreditCard,
    },
    {
      title: "Código Embed",
      href: "/dashboard/embed",
      icon: Code,
    },
    {
      title: "QR Code",
      href: "/dashboard/qrcode",
      icon: QrCode,
    },
  ]

  if (!mounted) return null

  // Renderizar o nome e email do usuário mesmo se userProfile ainda estiver carregando
  const displayName = userProfile?.full_name || user?.user_metadata?.full_name || "Usuário"
  const displayEmail = user?.email || ""

  return (
    <TooltipProvider>
      <aside className={cn(
        "flex flex-col h-full border-r bg-background transition-all duration-300 ease-in-out",
        isCollapsed ? "w-[70px]" : "w-[250px]",
        className
      )}>
        <div className="flex h-16 items-center justify-between px-4 border-b">
          <Link href="/dashboard" className="flex items-center gap-2">
            {!isCollapsed && <span className="text-xl font-bold text-[#eb07a4]">Agendizo</span>}
            {isCollapsed && <span className="text-xl font-bold text-[#eb07a4]">A</span>}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="hidden lg:flex"
          >
            <ChevronLeft className={cn(
              "h-4 w-4 transition-transform duration-200",
              isCollapsed && "rotate-180"
            )} />
            <span className="sr-only">Toggle sidebar</span>
          </Button>
        </div>

        <div className="flex flex-col gap-2 px-3 py-4 h-[calc(100vh-64px)] overflow-y-auto">
          {!isCollapsed && (
            <div className="flex flex-col mb-6 px-2">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={
                      userProfile?.avatar_url ||
                      user?.user_metadata?.avatar_url ||
                      "/placeholder.svg?height=40&width=40&query=user" ||
                      "/placeholder.svg"
                    }
                    alt={displayName}
                  />
                  <AvatarFallback>{getUserInitials()}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <p className="font-medium text-sm truncate max-w-[150px]">{displayName}</p>
                  <p className="text-xs text-muted-foreground truncate max-w-[150px]">{displayEmail}</p>
                </div>
              </div>
              {businessRating > 0 && <div className="mt-2 ml-1">{renderStars(businessRating)}</div>}
            </div>
          )}

          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = isActive(item.href)

              return isCollapsed ? (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-md transition-colors duration-200",
                        active
                          ? "bg-[#eb07a4] text-white"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="sr-only">{item.title}</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">{item.title}</TooltipContent>
                </Tooltip>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex h-10 items-center gap-4 rounded-md px-3 transition-colors duration-200",
                    active
                      ? "bg-[#eb07a4] text-white"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="mt-auto border-t px-3 py-4">
          <nav className="space-y-1">
            {bottomNavItems.map((item) => {
              const active = isActive(item.href)

              return isCollapsed ? (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-md transition-colors duration-200",
                        active
                          ? "bg-[#eb07a4] text-white"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="sr-only">{item.title}</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">{item.title}</TooltipContent>
                </Tooltip>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex h-10 items-center gap-4 rounded-md px-3 transition-colors duration-200",
                    active
                      ? "bg-[#eb07a4] text-white"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </Link>
              )
            })}

            {isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={signOut}
                    className="flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="sr-only">Sair</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Sair</TooltipContent>
              </Tooltip>
            ) : (
              <button
                onClick={signOut}
                className="flex h-10 w-full items-center gap-4 rounded-md px-3 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
              >
                <LogOut className="h-5 w-5" />
                <span>Sair</span>
              </button>
            )}
          </nav>
        </div>
      </aside>
    </TooltipProvider>
  )
}
