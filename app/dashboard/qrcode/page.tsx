"use client"

import { useState, useEffect } from "react"
import { PageShell } from "@/components/dashboard/page-shell"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import { QrCode, Download, ExternalLink } from "lucide-react"
import QRCode from "qrcode"

interface Business {
  id: string
  name: string
  slug: string
}

export default function QRCodePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("")
  const [business, setBusiness] = useState<Business | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState("")
  const supabase = createClient()

  useEffect(() => {
    loadBusinesses()
  }, [])

  useEffect(() => {
    if (selectedBusinessId) {
      loadBusiness(selectedBusinessId)
    }
  }, [selectedBusinessId])

  const loadBusinesses = async () => {
    try {
      setIsLoading(true)

      const { data: userData, error: userError } = await supabase.auth.getUser()

      if (userError) throw userError

      if (!userData?.user) {
        throw new Error("Usuário não autenticado")
      }

      const { data, error } = await supabase
        .from("businesses")
        .select("id, name, slug")
        .eq("owner_id", userData.user.id)
        .order("name")

      if (error) throw error

      setBusinesses(data || [])
      
      // Se houver negócios, seleciona o primeiro
      if (data && data.length > 0) {
        setSelectedBusinessId(data[0].id)
      }
    } catch (error) {
      console.error("Error loading businesses:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar seus negócios",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadBusiness = async (businessId: string) => {
    try {
      const business = businesses.find(b => b.id === businessId)
      if (!business) return

      setBusiness(business)
      generateQRCode(business)
    } catch (error) {
      console.error("Error loading business:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as informações do negócio",
        variant: "destructive",
      })
    }
  }

  const generateQRCode = async (business: Business) => {
    try {
      const baseUrl = window.location.origin
      const url = `${baseUrl}/${business.slug}`

      // Gerar QR Code como URL de dados
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
      console.error("Error generating QR code:", error)
      toast({
        title: "Erro",
        description: "Não foi possível gerar o QR Code",
        variant: "destructive",
      })
    }
  }

  const downloadQRCode = async () => {
    if (!business?.slug) return

    try {
      const baseUrl = window.location.origin
      const url = `${baseUrl}/${business.slug}`

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
      link.download = `qrcode-${business.slug}.png`
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
    if (business?.slug) {
      const baseUrl = window.location.origin
      window.open(`${baseUrl}/${business.slug}`, "_blank")
    }
  }

  return (
    <PageShell>
      <PageShell.Content>
        {isLoading ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="flex justify-center">
              <Skeleton className="h-64 w-64" />
            </CardContent>
            <CardFooter className="flex justify-center">
              <Skeleton className="h-10 w-32 mr-2" />
              <Skeleton className="h-10 w-32" />
            </CardFooter>
          </Card>
        ) : businesses.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <QrCode className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Nenhum negócio encontrado</h3>
              <p className="text-muted-foreground text-center mt-1">
                Você precisa criar um negócio com um slug válido para gerar o QR Code.
              </p>
              <Button className="mt-4 bg-[#eb07a4] hover:bg-[#d0069a]" asChild>
                <a href="/dashboard/negocios/novo">Criar negócio</a>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Selecione o negócio</CardTitle>
                <CardDescription>Escolha qual negócio você deseja gerar o QR Code</CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={selectedBusinessId} onValueChange={setSelectedBusinessId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um negócio" />
                  </SelectTrigger>
                  <SelectContent>
                    {businesses.map((business) => (
                      <SelectItem key={business.id} value={business.id}>
                        {business.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {business && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
              </div>
            )}
          </div>
        )}
      </PageShell.Content>
    </PageShell>
  )
}
