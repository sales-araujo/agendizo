"use client"

import { useState, useEffect } from "react"
import { Settings, Calendar, MessageSquare, Video, CalendarRange, MessageCircle } from "lucide-react"
import { PageShell } from "@/components/dashboard/page-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import { useSettings } from "@/lib/contexts/settings-context"
import type { User } from "@/lib/types"

interface AppointmentSettings {
  defaultDuration: string
  bufferTime: string
  allowSameDay: boolean
  maxDaysInAdvance: string
  minTimeBeforeCancel: string
  allowClientReschedule: boolean
  allowClientCancel: boolean
  requireClientPhone: boolean
  requireClientEmail: boolean
}

interface IntegrationStatus {
  connected: boolean
  lastSync?: string
}

interface Integrations {
  whatsapp: IntegrationStatus
  googleCalendar: IntegrationStatus
  microsoftCalendar: IntegrationStatus
  zoom: IntegrationStatus
}

function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const { settings, updateSettings } = useSettings()
  const [appointmentSettings, setAppointmentSettings] = useState<AppointmentSettings>({
    defaultDuration: "60",
    bufferTime: "15",
    allowSameDay: true,
    maxDaysInAdvance: "30",
    minTimeBeforeCancel: "24",
    allowClientReschedule: true,
    allowClientCancel: true,
    requireClientPhone: true,
    requireClientEmail: true,
  })

  const [integrations, setIntegrations] = useState<Integrations>({
    whatsapp: { connected: false },
    googleCalendar: { connected: false },
    microsoftCalendar: { connected: false },
    zoom: { connected: false },
  })

  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      setIsLoading(true)
      const { data: userData, error: userError } = await supabase.auth.getUser()

      if (userError) throw userError

      if (!userData.user) {
        throw new Error("Usuário não encontrado")
      }

      setUser({
        id: userData.user.id,
        email: userData.user.email || "",
        full_name: userData.user.user_metadata?.full_name || "",
        avatar_url: userData.user.user_metadata?.avatar_url,
        created_at: userData.user.created_at,
        updated_at: userData.user.updated_at,
      })

      // Carregar configurações de agendamento
      const { data: settingsData, error: settingsError } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", userData.user.id)
        .maybeSingle()

      if (!settingsError && settingsData) {
        setAppointmentSettings({
          defaultDuration: settingsData.default_duration?.toString() || "60",
          bufferTime: settingsData.buffer_time?.toString() || "15",
          allowSameDay: settingsData.allow_same_day ?? true,
          maxDaysInAdvance: settingsData.max_days_in_advance?.toString() || "30",
          minTimeBeforeCancel: settingsData.min_time_before_cancel?.toString() || "24",
          allowClientReschedule: settingsData.allow_client_reschedule ?? true,
          allowClientCancel: settingsData.allow_client_cancel ?? true,
          requireClientPhone: settingsData.require_client_phone ?? true,
          requireClientEmail: settingsData.require_client_email ?? true,
        })
      }

      setIsLoading(false)
    } catch (error) {
      console.error("Error loading user data:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar suas configurações",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  const handleIntegrationToggle = (integration: keyof Integrations) => {
    toast({
      title: "Em breve",
      description: "Esta integração estará disponível em breve.",
      variant: "warning",
    })
  }

  const validateNumericField = (value: string, min: number, max: number): boolean => {
    const numValue = parseInt(value)
    return !isNaN(numValue) && numValue >= min && numValue <= max
  }

  const handleAppointmentSettingsChange = (key: keyof AppointmentSettings, value: string | boolean) => {
    if (typeof value === "string") {
      switch (key) {
        case "defaultDuration":
          if (!validateNumericField(value, 15, 480)) {
            toast({
              title: "Erro",
              description: "A duração deve estar entre 15 e 480 minutos",
              variant: "destructive",
            })
            return
          }
          break
        case "bufferTime":
          if (!validateNumericField(value, 0, 120)) {
            toast({
              title: "Erro",
              description: "O intervalo deve estar entre 0 e 120 minutos",
              variant: "destructive",
            })
            return
          }
          break
        case "maxDaysInAdvance":
          if (!validateNumericField(value, 1, 365)) {
            toast({
              title: "Erro",
              description: "O limite de dias deve estar entre 1 e 365",
              variant: "destructive",
            })
            return
          }
          break
        case "minTimeBeforeCancel":
          if (!validateNumericField(value, 0, 168)) {
            toast({
              title: "Erro",
              description: "O tempo mínimo deve estar entre 0 e 168 horas",
              variant: "destructive",
            })
            return
          }
          break
      }
    }

    setAppointmentSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const saveSettings = async () => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não encontrado",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      const { data: existingSettings } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle()

      const settingsData = {
        user_id: user.id,
        default_duration: parseInt(appointmentSettings.defaultDuration),
        buffer_time: parseInt(appointmentSettings.bufferTime),
        allow_same_day: appointmentSettings.allowSameDay,
        max_days_in_advance: parseInt(appointmentSettings.maxDaysInAdvance),
        min_time_before_cancel: parseInt(appointmentSettings.minTimeBeforeCancel),
        allow_client_reschedule: appointmentSettings.allowClientReschedule,
        allow_client_cancel: appointmentSettings.allowClientCancel,
        require_client_phone: appointmentSettings.requireClientPhone,
        require_client_email: appointmentSettings.requireClientEmail,
        updated_at: new Date().toISOString(),
        created_at: !existingSettings ? new Date().toISOString() : undefined,
      }

      const { error: settingsError } = await supabase.from("user_settings").upsert(settingsData)

      if (settingsError) throw settingsError

      toast({
        title: "Sucesso",
        description: "Suas configurações foram atualizadas com sucesso.",
        variant: "success",
      })

      await loadUserData()
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Erro",
        description: "Não foi possível salvar suas configurações",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <PageShell>
      <PageShell.Content>
        <Tabs defaultValue="appointments" className="space-y-4">
          <TabsList>
            <TabsTrigger value="appointments">Agendamentos</TabsTrigger>
            <TabsTrigger value="integrations">Integrações</TabsTrigger>
          </TabsList>

          <TabsContent value="appointments">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Agendamento</CardTitle>
                <CardDescription>Configure as opções de agendamento do seu negócio</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoading ? (
                  <div className="space-y-4">
                    {Array(6)
                      .fill(0)
                      .map((_, i) => (
                        <div key={i} className="space-y-2">
                          <Skeleton className="h-4 w-1/4" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                      ))}
                  </div>
                ) : (
                  <>
                    <div className="grid gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="defaultDuration">Duração padrão (minutos)</Label>
                        <Select
                          value={appointmentSettings.defaultDuration}
                          onValueChange={(value) => handleAppointmentSettingsChange("defaultDuration", value)}
                        >
                          <SelectTrigger id="defaultDuration">
                            <SelectValue placeholder="Selecione a duração" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="15">15 minutos</SelectItem>
                            <SelectItem value="30">30 minutos</SelectItem>
                            <SelectItem value="45">45 minutos</SelectItem>
                            <SelectItem value="60">1 hora</SelectItem>
                            <SelectItem value="90">1 hora e 30 minutos</SelectItem>
                            <SelectItem value="120">2 horas</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bufferTime">Intervalo entre agendamentos (minutos)</Label>
                        <Select
                          value={appointmentSettings.bufferTime}
                          onValueChange={(value) => handleAppointmentSettingsChange("bufferTime", value)}
                        >
                          <SelectTrigger id="bufferTime">
                            <SelectValue placeholder="Selecione o intervalo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Sem intervalo</SelectItem>
                            <SelectItem value="5">5 minutos</SelectItem>
                            <SelectItem value="10">10 minutos</SelectItem>
                            <SelectItem value="15">15 minutos</SelectItem>
                            <SelectItem value="30">30 minutos</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="maxDaysInAdvance">Limite de dias para agendamento antecipado</Label>
                        <Select
                          value={appointmentSettings.maxDaysInAdvance}
                          onValueChange={(value) => handleAppointmentSettingsChange("maxDaysInAdvance", value)}
                        >
                          <SelectTrigger id="maxDaysInAdvance">
                            <SelectValue placeholder="Selecione o limite" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="7">7 dias</SelectItem>
                            <SelectItem value="15">15 dias</SelectItem>
                            <SelectItem value="30">30 dias</SelectItem>
                            <SelectItem value="60">60 dias</SelectItem>
                            <SelectItem value="90">90 dias</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="minTimeBeforeCancel">Tempo mínimo para cancelamento (horas)</Label>
                        <Select
                          value={appointmentSettings.minTimeBeforeCancel}
                          onValueChange={(value) => handleAppointmentSettingsChange("minTimeBeforeCancel", value)}
                        >
                          <SelectTrigger id="minTimeBeforeCancel">
                            <SelectValue placeholder="Selecione o tempo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Sem restrição</SelectItem>
                            <SelectItem value="1">1 hora</SelectItem>
                            <SelectItem value="2">2 horas</SelectItem>
                            <SelectItem value="4">4 horas</SelectItem>
                            <SelectItem value="12">12 horas</SelectItem>
                            <SelectItem value="24">24 horas</SelectItem>
                            <SelectItem value="48">48 horas</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="allowSameDay">Permitir agendamentos no mesmo dia</Label>
                          <Switch
                            id="allowSameDay"
                            checked={appointmentSettings.allowSameDay}
                            onCheckedChange={(checked) => handleAppointmentSettingsChange("allowSameDay", checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor="allowClientReschedule">Permitir que clientes reagendem</Label>
                          <Switch
                            id="allowClientReschedule"
                            checked={appointmentSettings.allowClientReschedule}
                            onCheckedChange={(checked) => handleAppointmentSettingsChange("allowClientReschedule", checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor="allowClientCancel">Permitir que clientes cancelem</Label>
                          <Switch
                            id="allowClientCancel"
                            checked={appointmentSettings.allowClientCancel}
                            onCheckedChange={(checked) => handleAppointmentSettingsChange("allowClientCancel", checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor="requireClientPhone">Exigir telefone do cliente</Label>
                          <Switch
                            id="requireClientPhone"
                            checked={appointmentSettings.requireClientPhone}
                            onCheckedChange={(checked) => handleAppointmentSettingsChange("requireClientPhone", checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor="requireClientEmail">Exigir e-mail do cliente</Label>
                          <Switch
                            id="requireClientEmail"
                            checked={appointmentSettings.requireClientEmail}
                            onCheckedChange={(checked) => handleAppointmentSettingsChange("requireClientEmail", checked)}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => loadUserData()}
                  disabled={isLoading || isSaving}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => saveSettings()}
                  disabled={isLoading || isSaving}
                >
                  {isSaving ? "Salvando..." : "Salvar"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="integrations">
            <Card>
              <CardHeader>
                <CardTitle>Integrações</CardTitle>
                <CardDescription>Conecte seus serviços favoritos para melhorar sua experiência</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {/* WhatsApp Business */}
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <MessageCircle className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-medium">WhatsApp Business</h4>
                        <p className="text-sm text-muted-foreground">
                          Envie lembretes e confirmações automáticas para seus clientes
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={integrations.whatsapp.connected}
                      onCheckedChange={() => handleIntegrationToggle("whatsapp")}
                    />
                  </div>

                  {/* Google Calendar */}
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Calendar className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-medium">Google Agenda</h4>
                        <p className="text-sm text-muted-foreground">
                          Sincronize seus agendamentos com o Google Agenda
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={integrations.googleCalendar.connected}
                      onCheckedChange={() => handleIntegrationToggle("googleCalendar")}
                    />
                  </div>

                  {/* Microsoft Calendar */}
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-sky-100 rounded-lg">
                        <CalendarRange className="w-6 h-6 text-sky-600" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-medium">Microsoft Agenda</h4>
                        <p className="text-sm text-muted-foreground">
                          Sincronize seus agendamentos com o Microsoft Agenda
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={integrations.microsoftCalendar.connected}
                      onCheckedChange={() => handleIntegrationToggle("microsoftCalendar")}
                    />
                  </div>

                  {/* Zoom */}
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Video className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-medium">Zoom</h4>
                        <p className="text-sm text-muted-foreground">
                          Crie reuniões online automaticamente para seus agendamentos
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={integrations.zoom.connected}
                      onCheckedChange={() => handleIntegrationToggle("zoom")}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </PageShell.Content>
    </PageShell>
  )
}

export default SettingsPage
