"use client"

import { useState, useEffect } from "react"
import { PageShell } from "@/components/dashboard/page-shell"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import { Copy, ExternalLink, Code } from "lucide-react"

export default function EmbedPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [business, setBusiness] = useState(null)
  const [embedCode, setEmbedCode] = useState("")
  const [iframeCode, setIframeCode] = useState("")
  const [linkCode, setLinkCode] = useState("")
  const supabase = createClient()

  useEffect(() => {
    loadBusiness()
  }, [])

  const loadBusiness = async () => {
    try {
      setIsLoading(true)

      const { data: userData, error: userError } = await supabase.auth.getUser()

      if (userError) throw userError

      if (!userData?.user) {
        throw new Error("Usuário não autenticado")
      }

      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("owner_id", userData.user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) throw error

      setBusiness(data)

      if (data?.slug) {
        // URL completa com domínio
        const baseUrl = window.location.origin
        const pageUrl = `${baseUrl}/${data.slug}`

        // Código para botão
        setEmbedCode(
          `<a href="${pageUrl}" target="_blank" style="display:inline-block;background-color:#eb07a4;color:white;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;padding:10px 20px;text-decoration:none;border-radius:4px;box-shadow:0 2px 4px rgba(0,0,0,0.1);">Agendar agora</a>`,
        )

        // Código para iframe
        setIframeCode(
          `<iframe src="${pageUrl}" width="100%" height="600" style="border:none;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.1);" title="Agendamento ${data.name}"></iframe>`,
        )

        // Link direto
        setLinkCode(pageUrl)
      }

      setIsLoading(false)
    } catch (error) {
      console.error("Error loading business:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as informações do seu negócio",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text, type) => {
    try {
      navigator.clipboard.writeText(text).then(
        () => {
          toast({
            title: "Copiado!",
            description: `O código ${type} foi copiado para a área de transferência.`,
          })
        },
        (err) => {
          console.error("Erro ao copiar:", err)
          toast({
            title: "Erro ao copiar",
            description: "Não foi possível copiar o código automaticamente. Por favor, copie manualmente.",
            variant: "destructive",
          })
        },
      )
    } catch (error) {
      // Fallback para navegadores que não suportam clipboard API
      const textArea = document.createElement("textarea")
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()

      try {
        document.execCommand("copy")
        toast({
          title: "Copiado!",
          description: `O código ${type} foi copiado para a área de transferência.`,
        })
      } catch (err) {
        toast({
          title: "Erro ao copiar",
          description: "Não foi possível copiar o código. Por favor, copie manualmente.",
          variant: "destructive",
        })
      }

      document.body.removeChild(textArea)
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
      <PageShell.Header>
        <PageShell.Title>Código Incorporado</PageShell.Title>
        <PageShell.Description>
          Incorpore o sistema de agendamento em seu site
        </PageShell.Description>
      </PageShell.Header>
      <PageShell.Content>
        {isLoading ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ) : !business?.slug ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <Code className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Nenhum negócio encontrado</h3>
              <p className="text-muted-foreground text-center mt-1">
                Você precisa criar um negócio com um slug válido para gerar o código incorporado.
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
                <CardTitle>Sua página de agendamento</CardTitle>
                <CardDescription>Sua página pública de agendamento está disponível em:</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Input value={linkCode} readOnly className="font-medium" />
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard(linkCode, "do link")}>
                    <Copy className="h-4 w-4" />
                    <span className="sr-only">Copiar link</span>
                  </Button>
                  <Button variant="outline" size="icon" onClick={openPreview}>
                    <ExternalLink className="h-4 w-4" />
                    <span className="sr-only">Abrir página</span>
                  </Button>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={openPreview} className="bg-[#eb07a4] hover:bg-[#d0069a]">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Ver Página
                </Button>
              </CardFooter>
            </Card>

            <Tabs defaultValue="iframe">
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="iframe">Incorporar página</TabsTrigger>
                <TabsTrigger value="link">Link direto</TabsTrigger>
              </TabsList>

              <TabsContent value="iframe">
                <Card>
                  <CardHeader>
                    <CardTitle>Incorporar página completa</CardTitle>
                    <CardDescription>Adicione sua página de agendamento diretamente em seu site.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-muted p-4 rounded-md">
                      <pre className="text-sm overflow-x-auto whitespace-pre-wrap">{iframeCode}</pre>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => copyToClipboard(iframeCode, "do iframe")}
                      className="w-full"
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copiar código
                    </Button>
                  </CardContent>
                  <CardHeader>
                    <CardTitle>Prévia</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-lg p-4 bg-background">
                      <div className="aspect-video relative">
                        <iframe
                          src={linkCode}
                          className="absolute inset-0 w-full h-full rounded-md"
                          style={{ border: "none" }}
                          title={`Agendamento ${business.name}`}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="link">
                <Card>
                  <CardHeader>
                    <CardTitle>Link direto</CardTitle>
                    <CardDescription>Compartilhe o link direto para sua página de agendamento.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Input value={linkCode} readOnly className="font-medium" />
                      <Button variant="outline" size="icon" onClick={() => copyToClipboard(linkCode, "do link")}>
                        <Copy className="h-4 w-4" />
                        <span className="sr-only">Copiar link</span>
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Você pode compartilhar este link em suas redes sociais, email, WhatsApp ou qualquer outro canal.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </PageShell.Content>
    </PageShell>
  )
}
