"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"

export function LGPDConsent() {
  const [isVisible, setIsVisible] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)

    // Verificar se o usuário já aceitou os termos
    const hasConsent = localStorage.getItem("lgpd-consent")

    if (!hasConsent) {
      // Mostrar o banner após um pequeno delay
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 1500)

      return () => clearTimeout(timer)
    }
  }, [])

  // Não renderizar nada durante a hidratação
  if (!isMounted) {
    return null
  }

  const handleAccept = () => {
    // Salvar consentimento no localStorage
    localStorage.setItem("lgpd-consent", "true")
    setIsVisible(false)
  }

  const handleClose = () => {
    setIsVisible(false)
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="mx-auto max-w-4xl shadow-lg border-primary/20">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Política de Privacidade</CardTitle>
                <Button variant="ghost" size="icon" onClick={handleClose}>
                  <X className="h-4 w-4" />
                  <span className="sr-only">Fechar</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="text-sm">
              <p>
                Utilizamos cookies e tecnologias semelhantes para melhorar a sua experiência em nosso site, personalizar
                conteúdo e anúncios, fornecer recursos de mídia social e analisar o tráfego do site. Ao continuar
                navegando, você concorda com a nossa{" "}
                <a href="/privacidade" className="text-primary hover:underline">
                  Política de Privacidade
                </a>{" "}
                e{" "}
                <a href="/termos" className="text-primary hover:underline">
                  Termos de Uso
                </a>
                .
              </p>
            </CardContent>
            <CardFooter>
              <Button onClick={handleAccept} className="w-full">
                Aceitar e continuar
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
