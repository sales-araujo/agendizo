"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Building, Upload, Save, Loader2 } from "lucide-react"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"

export default function CompanySettingsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [businesses, setBusinesses] = useState([])
  const [selectedBusiness, setSelectedBusiness] = useState(null)
  const [logoSize, setLogoSize] = useState("medium")
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [bannerFile, setBannerFile] = useState(null)
  const [bannerPreview, setBannerPreview] = useState(null)
  const router = useRouter()

  const supabase = createClient()

  useEffect(() => {
    loadBusinesses()
  }, [])

  const loadBusinesses = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data, error } = await supabase.from("businesses").select("*").eq("owner_id", user.id)

      if (error) throw error

      setBusinesses(data || [])

      if (data && data.length > 0) {
        setSelectedBusiness(data[0])
        if (data[0].logo_url) {
          setLogoPreview(data[0].logo_url)
        }
        if (data[0].banner_url) {
          setBannerPreview(data[0].banner_url)
        }
        if (data[0].logo_size) {
          setLogoSize(data[0].logo_size)
        }
      }

      setIsLoading(false)
    } catch (error) {
      console.error("Erro ao carregar negócios:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar seus negócios",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleBannerChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setBannerFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setBannerPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveSettings = async () => {
    if (!selectedBusiness) return

    setIsSaving(true)

    try {
      let logoUrl = selectedBusiness.logo_url
      let bannerUrl = selectedBusiness.banner_url

      // Upload do logo se houver um novo arquivo
      if (logoFile) {
        const logoFileName = `business_${selectedBusiness.id}_logo_${Date.now()}`
        const { data: logoData, error: logoError } = await supabase.storage
          .from("business_assets")
          .upload(logoFileName, logoFile)

        if (logoError) throw logoError

        const {
          data: { publicUrl: newLogoUrl },
        } = supabase.storage.from("business_assets").getPublicUrl(logoFileName)

        logoUrl = newLogoUrl
      }

      // Upload do banner se houver um novo arquivo
      if (bannerFile) {
        const bannerFileName = `business_${selectedBusiness.id}_banner_${Date.now()}`
        const { data: bannerData, error: bannerError } = await supabase.storage
          .from("business_assets")
          .upload(bannerFileName, bannerFile)

        if (bannerError) throw bannerError

        const {
          data: { publicUrl: newBannerUrl },
        } = supabase.storage.from("business_assets").getPublicUrl(bannerFileName)

        bannerUrl = newBannerUrl
      }

      // Atualizar as informações do negócio
      const { error } = await supabase
        .from("businesses")
        .update({
          logo_url: logoUrl,
          banner_url: bannerUrl,
          logo_size: logoSize,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedBusiness.id)

      if (error) throw error

      toast({
        title: "Configurações salvas",
        description: "As configurações da empresa foram atualizadas com sucesso",
      })

      // Atualizar o objeto selectedBusiness
      setSelectedBusiness({
        ...selectedBusiness,
        logo_url: logoUrl,
        banner_url: bannerUrl,
        logo_size: logoSize,
      })

      // Limpar os arquivos selecionados
      setLogoFile(null)
      setBannerFile(null)
    } catch (error) {
      console.error("Erro ao salvar configurações:", error)
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <DashboardShell>
      <DashboardShell.Header>
        <div className="flex items-center justify-between">
          <div>
            <DashboardShell.Title>Configurações da Empresa</DashboardShell.Title>
            <DashboardShell.Description>
              Personalize a aparência e as informações da sua empresa
            </DashboardShell.Description>
          </div>
          <Button
            onClick={handleSaveSettings}
            className="bg-pink-600 hover:bg-pink-700"
            disabled={isLoading || isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar alterações
              </>
            )}
          </Button>
        </div>
      </DashboardShell.Header>
      <DashboardShell.Content>
        {isLoading ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-1/4" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          </div>
        ) : businesses.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <Building className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Nenhum negócio encontrado</h3>
              <p className="text-muted-foreground text-center mt-1">
                Você precisa criar um negócio antes de configurar a aparência.
              </p>
              <Button
                className="mt-4 bg-pink-600 hover:bg-pink-700"
                onClick={() => router.push("/dashboard/negocios/novo")}
              >
                Criar Negócio
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Identidade Visual</CardTitle>
                <CardDescription>Configure o logotipo e o banner da sua empresa</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Label>Logotipo da empresa</Label>
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                      <div className="border rounded-md p-4 flex items-center justify-center bg-muted/30 h-40">
                        {logoPreview ? (
                          <img
                            src={logoPreview || "/placeholder.svg"}
                            alt="Logotipo"
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <div className="text-center">
                            <Building className="h-12 w-12 mx-auto text-muted-foreground" />
                            <p className="text-sm text-muted-foreground mt-2">Nenhum logotipo carregado</p>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        Para melhor visualização use 300 × 150px
                      </p>
                      <div className="mt-4">
                        <Label htmlFor="logo-upload" className="block mb-2">
                          Carregar logotipo
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            id="logo-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleLogoChange}
                            className="flex-1"
                          />
                          <Button
                            variant="outline"
                            onClick={() => {
                              setLogoFile(null)
                              setLogoPreview(selectedBusiness.logo_url)
                            }}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1">
                      <Label className="block mb-4">Tamanho do logotipo</Label>
                      <RadioGroup value={logoSize} onValueChange={setLogoSize} className="flex flex-col space-y-4">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="small" id="logo-small" />
                          <Label htmlFor="logo-small">Logotipo pequeno</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="medium" id="logo-medium" />
                          <Label htmlFor="logo-medium">Logotipo médio</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="large" id="logo-large" />
                          <Label htmlFor="logo-large">Logotipo grande</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <Label>Imagem do banner</Label>
                  <div className="border rounded-md p-4 flex items-center justify-center bg-muted/30 h-48">
                    {bannerPreview ? (
                      <img
                        src={bannerPreview || "/placeholder.svg"}
                        alt="Banner"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <div className="text-center">
                        <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mt-2">Nenhuma imagem de banner carregada</p>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Para melhor visualização use 1600 × 1000px
                  </p>
                  <div className="mt-4">
                    <Label htmlFor="banner-upload" className="block mb-2">
                      Carregar imagem do banner
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="banner-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleBannerChange}
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        onClick={() => {
                          setBannerFile(null)
                          setBannerPreview(selectedBusiness.banner_url)
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleSaveSettings}
                  className="bg-pink-600 hover:bg-pink-700 w-full"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Salvar alterações
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
      </DashboardShell.Content>
    </DashboardShell>
  )
}
