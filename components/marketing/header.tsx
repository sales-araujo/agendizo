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

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  // Função para obter as iniciais do nome do usuário
  const getUserInitials = () => {
    if (!user || !user.user_metadata?.full_name) return "U"

    const fullName = user.user_metadata.full_name
    const names = fullName.split(" ")

    if (names.length === 1) return names[0].charAt(0).toUpperCase()

    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase()
  }

  // Função para obter o nome abreviado do usuário
  const getShortName = () => {
    if (!user || !user.user_metadata?.full_name) return "Usuário"

    const fullName = user.user_metadata.full_name
    const names = fullName.split(" ")

    if (names.length === 1) return names[0]

    return names[0]
  }

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
            Início
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
            Dúvidas
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
                      src={user.user_metadata?.avatar_url || "/placeholder.svg?height=32&width=32&query=user"}
                      alt={user.user_metadata?.full_name || "Usuário"}
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
                        <p className="font-medium">{user.user_metadata?.full_name || "Usuário"}</p>
                        <p className="text-sm text-muted-foreground truncate">{user.email}</p>
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
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Entrar
                  </Button>
                </Link>
                <Link href="/registro">
                  <Button size="sm">Registrar</Button>
                </Link>
              </>
            )}
          </div>
        )}

        {/* Mobile Menu Button */}
        <button className="flex md:hidden" onClick={toggleMenu} aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}>
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          "fixed inset-0 top-16 z-50 flex flex-col bg-background md:hidden",
          isMenuOpen ? "flex" : "hidden",
        )}
      >
        <nav className="flex flex-col gap-4 p-6">
          <Link
            href="/"
            className="text-lg font-medium transition-colors hover:text-primary"
            onClick={() => setIsMenuOpen(false)}
          >
            Início
          </Link>
          <Link
            href="/#recursos"
            className="text-lg font-medium transition-colors hover:text-primary scroll-smooth"
            onClick={() => setIsMenuOpen(false)}
          >
            Recursos
          </Link>
          <Link
            href="/precos"
            className="text-lg font-medium transition-colors hover:text-primary"
            onClick={() => setIsMenuOpen(false)}
          >
            Preços
          </Link>
          <Link
            href="/contato"
            className="text-lg font-medium transition-colors hover:text-primary"
            onClick={() => setIsMenuOpen(false)}
          >
            Contato
          </Link>
          <Link
            href="/duvidas"
            className="text-lg font-medium transition-colors hover:text-primary"
            onClick={() => setIsMenuOpen(false)}
          >
            Dúvidas
          </Link>

          {mounted && (
            <div className="flex flex-col gap-2 mt-4">
              {user ? (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={user.user_metadata?.avatar_url || "/placeholder.svg?height=32&width=32&query=user"}
                        alt={user.user_metadata?.full_name || "Usuário"}
                      />
                      <AvatarFallback>{getUserInitials()}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{user.user_metadata?.full_name || "Usuário"}</span>
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
                  <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" className="w-full">
                      Entrar
                    </Button>
                  </Link>
                  <Link href="/registro" onClick={() => setIsMenuOpen(false)}>
                    <Button className="w-full">Registrar</Button>
                  </Link>
                </>
              )}
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}
