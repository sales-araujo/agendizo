"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowUp } from "lucide-react"

export function BackToTop() {
  const [isVisible, setIsVisible] = useState(false)

  // Mostrar botão após rolar 500px
  const toggleVisibility = () => {
    if (window.pageYOffset > 500) {
      setIsVisible(true)
    } else {
      setIsVisible(false)
    }
  }

  // Função para voltar ao topo suavemente
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  useEffect(() => {
    window.addEventListener("scroll", toggleVisibility)
    return () => window.removeEventListener("scroll", toggleVisibility)
  }, [])

  return (
    <div
      className={`fixed right-6 bottom-6 z-50 transition-opacity duration-300 ${isVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
    >
      <Button
        size="icon"
        className="h-12 w-12 rounded-full shadow-lg bg-[#eb07a4] hover:bg-[#d0069a]"
        onClick={scrollToTop}
        aria-label="Voltar ao topo"
      >
        <ArrowUp className="h-5 w-5" />
      </Button>
    </div>
  )
}
