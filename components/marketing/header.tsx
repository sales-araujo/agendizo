"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, LogOut, User, Settings, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/auth/auth-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from "@/lib/supabase/client"

interface UserProfile {
  id: string
  full_name: string
  avatar_url: string | null
  email: string
}

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const supabase = createClient()

  // Função para buscar o perfil do usuário
  const fetchUserProfile = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (error) {
        console.error("Erro ao buscar perfil:", error)
        // Se não encontrar o perfil, usar os dados do user_metadata
        setUserProfile({
          id: user.id,
          full_name: user.user_metadata?.full_name || "Usuário",
          avatar_url: user.user_metadata?.avatar_url,
          email: user.email || "",
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

  useEffect(() => {
    setMounted(true)
    if (user) {
      fetchUserProfile()
    }
  }, [user])

  // Escutar eventos de atualização do perfil
  useEffect(() => {
    const handleProfileUpdate = async (event: CustomEvent) => {
      if (event.detail) {
        // Ao invés de apenas atualizar com os dados do evento,
        // vamos buscar o perfil atualizado do banco
        await fetchUserProfile()
      }
    }

    window.addEventListener('profile-updated' as any, handleProfileUpdate)

    return () => {
      window.removeEventListener('profile-updated' as any, handleProfileUpdate)
    }
  }, [])

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  // Função para obter as iniciais do nome do usuário
  const getUserInitials = () => {
    const fullName = userProfile?.full_name || "U"
    const names = fullName.split(" ")

    if (names.length === 1) return names[0].charAt(0).toUpperCase()

    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase()
  }

  // Função para obter o nome abreviado do usuário
  const getShortName = () => {
    const fullName = userProfile?.full_name || "Usuário"
    const names = fullName.split(" ")

    if (names.length === 1) return names[0]

    return names[0]
  }

  // Atualizar o avatar e nome nos componentes que os usam
  const avatarUrl = userProfile?.avatar_url
  const displayName = userProfile?.full_name || "Usuário"
  const displayEmail = userProfile?.email || user?.email || ""

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container max-w-7xl mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-primary">Agendizo</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              pathname === "/" && "text-primary",
            )}
          >
            Home
          </Link>
          <Link href="/#recursos" className="text-sm font-medium transition-colors hover:text-primary scroll-smooth">
            Recursos
          </Link>
          <Link
            href="/precos"
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              pathname === "/precos" && "text-primary",
            )}
          >
            Preços
          </Link>
          <Link
            href="/contato"
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              pathname === "/contato" && "text-primary",
            )}
          >
            Contato
          </Link>
          <Link
            href="/duvidas"
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              pathname === "/duvidas" && "text-primary",
            )}
          >
            FAQ
          </Link>
        </nav>

        {/* Auth Buttons or User Profile */}
        {mounted && (
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <div className="relative">
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-accent cursor-pointer"
                  onMouseEnter={() => setIsDropdownOpen(true)}
                  onMouseLeave={() => setIsDropdownOpen(false)}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={avatarUrl || "/placeholder.svg?height=32&width=32&query=user"}
                      alt={displayName}
                    />
                    <AvatarFallback>{getUserInitials()}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-sm">{getShortName()}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </div>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden z-50"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      onMouseEnter={() => setIsDropdownOpen(true)}
                      onMouseLeave={() => setIsDropdownOpen(false)}
                    >
                      <div className="p-4 border-b">
                        <p className="font-medium">{displayName}</p>
                        <p className="text-sm text-muted-foreground truncate">{displayEmail}</p>
                      </div>
                      <div className="p-2">
                        <Link href="/dashboard" className="flex items-center gap-2 p-2 rounded-md hover:bg-accent">
                          <User className="h-4 w-4" />
                          <span>Dashboard</span>
                        </Link>
                        <Link
                          href="/dashboard/perfil"
                          className="flex items-center gap-2 p-2 rounded-md hover:bg-accent"
                        >
                          <User className="h-4 w-4" />
                          <span>Perfil</span>
                        </Link>
                        <Link
                          href="/dashboard/configuracoes"
                          className="flex items-center gap-2 p-2 rounded-md hover:bg-accent"
                        >
                          <Settings className="h-4 w-4" />
                          <span>Configurações</span>
                        </Link>
                      </div>
                      <div className="p-2 border-t">
                        <button
                          onClick={() => signOut()}
                          className="flex w-full items-center gap-2 p-2 rounded-md hover:bg-accent text-red-500"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Sair</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/entrar">Entrar</Link>
                </Button>
                <Button asChild>
                  <Link href="/cadastro">Cadastrar</Link>
                </Button>
              </>
            )}
          </div>
        )}

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 hover:bg-accent rounded-lg"
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t"
          >
            <div className="container py-4 px-4 space-y-4">
              <nav className="flex flex-col space-y-4">
                <Link
                  href="/"
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    pathname === "/" && "text-primary",
                  )}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Home
                </Link>
                <Link
                  href="/#recursos"
                  className="text-sm font-medium transition-colors hover:text-primary"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Recursos
                </Link>
                <Link
                  href="/precos"
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    pathname === "/precos" && "text-primary",
                  )}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Preços
                </Link>
                <Link
                  href="/contato"
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    pathname === "/contato" && "text-primary",
                  )}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Contato
                </Link>
                <Link
                  href="/duvidas"
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    pathname === "/duvidas" && "text-primary",
                  )}
                  onClick={() => setIsMenuOpen(false)}
                >
                  FAQ
                </Link>
              </nav>

              <div className="flex flex-col space-y-2">
                {user ? (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={avatarUrl || "/placeholder.svg?height=32&width=32&query=user"}
                          alt={displayName}
                        />
                        <AvatarFallback>{getUserInitials()}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{displayName}</span>
                    </div>
                    <Link href="/dashboard" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="outline" className="w-full justify-start">
                        Dashboard
                      </Button>
                    </Link>
                    <Link href="/dashboard/perfil" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="outline" className="w-full justify-start">
                        Perfil
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-red-500"
                      onClick={() => {
                        signOut()
                        setIsMenuOpen(false)
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sair
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" asChild className="w-full">
                      <Link href="/entrar">Entrar</Link>
                    </Button>
                    <Button asChild className="w-full">
                      <Link href="/cadastro">Cadastrar</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
