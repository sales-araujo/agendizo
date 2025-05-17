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
  const [isInitialized, setIsInitialized] = useState(false)
  const [businessRating, setBusinessRating] = useState(0)
  const supabase = createClient()

  // Carregar perfil do usuário apenas uma vez na inicialização
  useEffect(() => {
    let isMounted = true

    const initializeProfile = async () => {
      if (!user || isInitialized) return

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()

        if (error) {
          console.error("Erro ao buscar perfil:", error)
          return
        }

        if (data && isMounted) {
          setUserProfile(data as UserProfile)
          setIsInitialized(true)
        }
      } catch (error) {
        console.error("Erro ao buscar perfil:", error)
      }
    }

    initializeProfile()

    return () => {
      isMounted = false
    }
  }, [user, isInitialized])

  // Configurar subscription para atualizações em tempo real
  useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel(`profile:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new) {
            setUserProfile(payload.new as UserProfile)
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [user?.id])

  // Escutar apenas eventos de atualização manual do perfil
  useEffect(() => {
    const handleProfileUpdate = (event: CustomEvent) => {
      const newProfile = event.detail
      if (newProfile && newProfile.id === user?.id) {
        setUserProfile(newProfile)
      }
    }

    window.addEventListener('profile-updated' as any, handleProfileUpdate)

    return () => {
      window.removeEventListener('profile-updated' as any, handleProfileUpdate)
    }
  }, [user?.id])

  // Inicialização do componente
  useEffect(() => {
    setMounted(true)

    const savedState = localStorage.getItem("sidebar-collapsed")
    if (savedState) {
      const isCollapsed = savedState === "true"
      setIsCollapsed(isCollapsed)
      const event = new CustomEvent('sidebar-toggle', {
        detail: { isCollapsed }
      })
      window.dispatchEvent(event)
    }

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

  const toggleSidebar = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem("sidebar-collapsed", newState ? "true" : "false")
    
    const event = new CustomEvent('sidebar-toggle', {
      detail: { isCollapsed: newState }
    })
    window.dispatchEvent(event)
  }

  // Funções auxiliares
  const getUserInitials = () => {
    if (!userProfile?.full_name) return "U"
    const names = userProfile.full_name.split(" ")
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

  if (!mounted || !user) return null

  // Usar apenas dados do perfil, sem fallbacks
  const displayName = userProfile?.full_name || "Usuário"
  const displayEmail = user.email || ""
  const avatarUrl = userProfile?.avatar_url || "/placeholder.svg"

  return (
    <TooltipProvider>
      <aside className={cn(
        "fixed left-0 top-0 flex flex-col h-screen border-r bg-background transition-all duration-300 ease-in-out z-40",
        isCollapsed ? "w-[70px]" : "w-[250px]",
        "lg:translate-x-0",
        !isOpen && "-translate-x-full lg:translate-x-0",
        className
      )}>
        <header className={cn(
          "sticky top-0 z-10 flex min-h-[64px] items-center justify-between border-b bg-background",
          isCollapsed ? "justify-center px-0" : "px-4"
        )}>
          {!isCollapsed && (
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl font-bold text-[#eb07a4] hidden md:block">Agendizo</span>
            </Link>
          )}
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
        </header>

        <div className="flex flex-col gap-2 px-2 py-4 flex-grow overflow-y-auto">
          {!isCollapsed ? (
            <div className="flex flex-col mb-3 px-2">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={avatarUrl}
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
          ) : (
            <div className="flex justify-center mb-3">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={avatarUrl}
                  alt={displayName}
                />
                <AvatarFallback>{getUserInitials()}</AvatarFallback>
              </Avatar>
            </div>
          )}

          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = isActive(item.href)
              return (
                <Tooltip key={item.href} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center rounded-md transition-colors duration-200",
                        isCollapsed 
                          ? "h-10 w-full justify-center" 
                          : "h-10 px-3 gap-4",
                        active
                          ? "bg-[#eb07a4] text-white"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                      )}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </Link>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right">
                      {item.title}
                    </TooltipContent>
                  )}
                </Tooltip>
              )
            })}
          </nav>

          <div className="mt-auto pt-4 border-t">
            <nav className="space-y-1">
              {bottomNavItems.map((item) => (
                <Tooltip key={item.href} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center rounded-md transition-colors duration-200",
                        isCollapsed 
                          ? "h-10 w-full justify-center" 
                          : "h-10 px-3 gap-4",
                        isActive(item.href)
                          ? "bg-[#eb07a4] text-white"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                      )}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </Link>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right">
                      {item.title}
                    </TooltipContent>
                  )}
                </Tooltip>
              ))}

              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <button
                    onClick={signOut}
                    className={cn(
                      "flex items-center rounded-md transition-colors duration-200 text-red-500 hover:bg-accent hover:text-red-600",
                      isCollapsed 
                        ? "h-10 w-full justify-center" 
                        : "h-10 px-3 gap-4 w-full"
                    )}
                  >
                    <LogOut className="h-5 w-5 flex-shrink-0" />
                    {!isCollapsed && <span>Sair</span>}
                  </button>
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right">
                    Sair
                  </TooltipContent>
                )}
              </Tooltip>
            </nav>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  )
}
