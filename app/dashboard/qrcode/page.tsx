"use client"

import { useState, useEffect } from "react"
import { PageShell } from "@/components/dashboard/page-shell"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import { QrCode, Download, ExternalLink, Copy } from "lucide-react"
import QRCode from "qrcode"
import { useSettings } from '@/lib/contexts/settings-context'

interface Business {
  id: string
  name: string
  slug: string
}

export default function QRCodePage() {
  const { selectedBusiness } = useSettings()
  const [qrCodeUrl, setQrCodeUrl] = useState("")

  useEffect(() => {
    if (selectedBusiness) {
      generateQRCode(selectedBusiness)
    } else {
      setQrCodeUrl("")
    }
  }, [selectedBusiness])

  const generateQRCode = async (business: { slug: string }) => {
    try {
      const baseUrl = window.location.origin
      const url = `${baseUrl}/${business.slug}`
      const dataUrl = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
          dark: "#eb07a4",
          light: "#ffffff",
        },
      })
      setQrCodeUrl(dataUrl)
    } catch (error) {
      setQrCodeUrl("")
    }
  }

  const downloadQRCode = async () => {
    if (!selectedBusiness?.slug) return

    try {
      const baseUrl = window.location.origin
      const url = `${baseUrl}/${selectedBusiness.slug}`

      // Criar um canvas temporário apenas para o download
      const canvas = document.createElement("canvas")
      await QRCode.toCanvas(canvas, url, {
        width: 300,
        margin: 2,
        color: {
          dark: "#eb07a4",
          light: "#ffffff",
        },
      })

      const link = document.createElement("a")
      link.download = `qrcode-${selectedBusiness.slug}.png`
      link.href = canvas.toDataURL("image/png")
      link.click()

      toast({
        title: "QR Code baixado",
        description: "O QR Code foi baixado com sucesso.",
        variant: "success",
      })
    } catch (error) {
      console.error("Error downloading QR code:", error)
      toast({
        title: "Erro",
        description: "Não foi possível baixar o QR Code",
        variant: "destructive",
      })
    }
  }

  const openPreview = () => {
    if (selectedBusiness?.slug) {
      const baseUrl = window.location.origin
      window.open(`${baseUrl}/${selectedBusiness.slug}`, "_blank")
    }
  }

  if (!selectedBusiness) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <QrCode className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Nenhum negócio encontrado</h3>
          <p className="text-muted-foreground text-center mt-1">
            Você precisa criar um negócio antes de gerar o QR Code.
          </p>
          <Button className="mt-4 bg-[#eb07a4] hover:bg-[#d0069a]" asChild>
            <a href="/dashboard/negocios/novo">Criar negócio</a>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <PageShell>
      <PageShell.Content>
        <Card>
          <CardHeader>
            <CardTitle>QR Code para sua página</CardTitle>
            <CardDescription>Escaneie este QR Code para acessar sua página de agendamento</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            {qrCodeUrl ? (
              <div className="border p-4 rounded-lg bg-white">
                <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64" />
              </div>
            ) : (
              <div className="w-64 h-64 flex items-center justify-center">
                <Skeleton className="h-64 w-64" />
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-center space-x-4">
            <Button onClick={downloadQRCode} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Baixar QR Code
            </Button>
            <Button onClick={openPreview} className="bg-[#eb07a4] hover:bg-[#d0069a]">
              <ExternalLink className="mr-2 h-4 w-4" />
              Ver Página
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Como usar</CardTitle>
            <CardDescription>Dicas para compartilhar seu QR Code</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium">Imprima e compartilhe</h3>
              <p className="text-sm text-muted-foreground">
                Baixe o QR Code e imprima-o para colocar em seu estabelecimento, cartões de visita, folhetos
                promocionais ou qualquer material impresso.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Compartilhe digitalmente</h3>
              <p className="text-sm text-muted-foreground">
                Adicione o QR Code ao seu site, assinatura de email, perfis de redes sociais ou envie diretamente
                para seus clientes.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Facilite o agendamento</h3>
              <p className="text-sm text-muted-foreground">
                Seus clientes podem simplesmente escanear o código com a câmera do smartphone para acessar sua
                página de agendamento instantaneamente.
              </p>
            </div>

            <div className="bg-muted p-4 rounded-lg mt-6">
              <p className="text-sm">
                <strong>Dica:</strong> Adicione uma chamada para ação junto ao QR Code, como "Escaneie para agendar"
                ou "Agende agora mesmo escaneando este código".
              </p>
            </div>
          </CardContent>
        </Card>
      </PageShell.Content>
    </PageShell>
  )
}
