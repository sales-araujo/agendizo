"use client"

import { useState, useEffect } from "react"
import { Settings, Bell, Calendar, Globe, Share2, MessageSquare } from "lucide-react"
import { PageShell } from "@/components/dashboard/page-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/lib/hooks/use-toast"
import { getUserProfile } from "@/lib/data"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@/lib/types"

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [generalSettings, setGeneralSettings] = useState({
    language: "pt-BR",
    timezone: "America/Sao_Paulo",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "24h",
    currency: "BRL",
  })

  const [appointmentSettings, setAppointmentSettings] = useState({
    defaultDuration: "60",
    bufferTime: "15",
    allowSameDay: true,
    maxDaysInAdvance: "30",
    minTimeBeforeCancel: "24",
  })

  const [notificationSettings, setNotificationSettings] = useState({
    emailReminders: true,
    smsReminders: false,
    whatsappReminders: true,
    reminderTime: "24",
  })

  const [integrationSettings, setIntegrationSettings] = useState({
    googleCalendar: false,
    microsoftCalendar: false,
    whatsappBusiness: false,
    instagram: false,
    facebook: false,
  })

  const [subscription, setSubscription] = useState({
    active: false,
    plan: "",
  })

  const supabase = createClient()
  const toast = useToast()

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      setIsLoading(true)
      const profile = await getUserProfile()

      if (!profile) {
        throw new Error("Perfil não encontrado")
      }

      setUser(profile)

      // Carregar configurações do usuário
      const { data: settingsData, error: settingsError } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", profile.id)
        .maybeSingle()

      if (!settingsError && settingsData) {
        // Configurações gerais
        setGeneralSettings({
          language: settingsData.language || "pt-BR",
          timezone: settingsData.timezone || "America/Sao_Paulo",
          dateFormat: settingsData.date_format || "DD/MM/YYYY",
          timeFormat: settingsData.time_format || "24h",
          currency: settingsData.currency || "BRL",
        })

        // Configurações de agendamento
        setAppointmentSettings({
          defaultDuration: settingsData.default_duration?.toString() || "60",
          bufferTime: settingsData.buffer_time?.toString() || "15",
          allowSameDay: settingsData.allow_same_day ?? true,
          maxDaysInAdvance: settingsData.max_days_in_advance?.toString() || "30",
          minTimeBeforeCancel: settingsData.min_time_before_cancel?.toString() || "24",
        })

        // Configurações de notificação
        setNotificationSettings({
          emailReminders: settingsData.email_reminders ?? true,
          smsReminders: settingsData.sms_reminders ?? false,
          whatsappReminders: settingsData.whatsapp_reminders ?? true,
          reminderTime: settingsData.reminder_time?.toString() || "24",
        })
      }

      // Carregar integrações do usuário
      const { data: integrationsData, error: integrationsError } = await supabase
        .from("integrations")
        .select("*")
        .eq("user_id", profile.id)
        .maybeSingle()

      if (!integrationsError && integrationsData) {
        setIntegrationSettings({
          googleCalendar: integrationsData.google_calendar ?? false,
          microsoftCalendar: integrationsData.microsoft_calendar ?? false,
          whatsappBusiness: integrationsData.whatsapp_business ?? false,
          instagram: integrationsData.instagram ?? false,
          facebook: integrationsData.facebook ?? false,
        })
      }

      // Verificar assinatura
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", profile.id)
        .eq("status", "active")
        .maybeSingle()

      if (!subscriptionError && subscriptionData) {
        setSubscription({
          active: true,
          plan: subscriptionData.plan_id,
        })
      }

      setIsLoading(false)
    } catch (error) {
      console.error("Error loading user data:", error)
      toast.error("Erro", "Não foi possível carregar suas configurações")
      setIsLoading(false)
    }
  }

  const handleGeneralSettingsChange = (key: keyof typeof generalSettings, value: string) => {
    setGeneralSettings({
      ...generalSettings,
      [key]: value,
    })
  }

  const handleAppointmentSettingsChange = (key: keyof typeof appointmentSettings, value: string | boolean) => {
    setAppointmentSettings({
      ...appointmentSettings,
      [key]: value,
    })
  }

  const handleNotificationSettingsChange = (key: keyof typeof notificationSettings, value: string | boolean) => {
    setNotificationSettings({
      ...notificationSettings,
      [key]: value,
    })
  }

  const handleIntegrationSettingsChange = (key: keyof typeof integrationSettings, value: boolean) => {
    setIntegrationSettings({
      ...integrationSettings,
      [key]: value,
    })
  }

  const saveSettings = async () => {
    if (!user) return

    setIsSaving(true)

    try {
      // Verificar se existem configurações do usuário
      const { data: existingSettings } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle()

      // Preparar dados para upsert
      const settingsData = {
        user_id: user.id,
        language: generalSettings.language,
        timezone: generalSettings.timezone,
        date_format: generalSettings.dateFormat,
        time_format: generalSettings.timeFormat,
        currency: generalSettings.currency,
        default_duration: Number.parseInt(appointmentSettings.defaultDuration),
        buffer_time: Number.parseInt(appointmentSettings.bufferTime),
        allow_same_day: appointmentSettings.allowSameDay,
        max_days_in_advance: Number.parseInt(appointmentSettings.maxDaysInAdvance),
        min_time_before_cancel: Number.parseInt(appointmentSettings.minTimeBeforeCancel),
        email_reminders: notificationSettings.emailReminders,
        sms_reminders: notificationSettings.smsReminders,
        whatsapp_reminders: notificationSettings.whatsappReminders,
        reminder_time: Number.parseInt(notificationSettings.reminderTime),
        updated_at: new Date().toISOString(),
      }

      // Se não existir, adicionar created_at
      if (!existingSettings) {
        settingsData["created_at"] = new Date().toISOString()
      }

      // Salvar configurações gerais
      const { error: settingsError } = await supabase.from("user_settings").upsert(settingsData)

      if (settingsError) throw settingsError

      // Verificar se existem integrações do usuário
      const { data: existingIntegrations } = await supabase
        .from("integrations")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle()

      // Preparar dados para upsert
      const integrationsData = {
        user_id: user.id,
        google_calendar: integrationSettings.googleCalendar,
        microsoft_calendar: integrationSettings.microsoftCalendar,
        whatsapp_business: integrationSettings.whatsappBusiness,
        instagram: integrationSettings.instagram,
        facebook: integrationSettings.facebook,
        updated_at: new Date().toISOString(),
      }

      // Se não existir, adicionar created_at
      if (!existingIntegrations) {
        integrationsData["created_at"] = new Date().toISOString()
      }

      // Salvar integrações
      const { error: integrationsError } = await supabase.from("integrations").upsert(integrationsData)

      if (integrationsError) throw integrationsError

      toast.success("Sucesso", "Suas configurações foram atualizadas com sucesso.")
    } catch (error) {
      console.error("Error saving settings:", error)
      toast.error("Erro", "Não foi possível salvar suas configurações. Tente novamente.")
    } finally {
      setIsSaving(false)
    }
  }

  const connectIntegration = async (integration: keyof typeof integrationSettings) => {
    if (!user) return

    if (!subscription.active) {
      toast.error("Erro", "Você precisa ter uma assinatura ativa para usar esta integração.")
      return
    }

    try {
      // Simulação de conexão com a integração
      toast.loading("Conectando...", {
        description: `Conectando com ${integration}...`,
      })

      // Simular um tempo de conexão
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Atualizar o estado
      handleIntegrationSettingsChange(integration, true)

      // Salvar no banco de dados
      const { error } = await supabase.from("integrations").upsert({
        user_id: user.id,
        [integration === "googleCalendar"
          ? "google_calendar"
          : integration === "microsoftCalendar"
            ? "microsoft_calendar"
            : integration === "whatsappBusiness"
              ? "whatsapp_business"
              : integration]: true,
        updated_at: new Date().toISOString(),
      })

      if (error) throw error

      toast.success("Sucesso", `A integração com ${integration} foi realizada com sucesso.`)
    } catch (error) {
      console.error(`Error connecting to ${integration}:`, error)
      toast.error("Erro", `Não foi possível conectar ao ${integration}. Tente novamente.`)
      handleIntegrationSettingsChange(integration, false)
    }
  }

  const disconnectIntegration = async (integration: keyof typeof integrationSettings) => {
    if (!user) return

    try {
      // Atualizar o estado
      handleIntegrationSettingsChange(integration, false)

      // Salvar no banco de dados
      const { error } = await supabase.from("integrations").upsert({
        user_id: user.id,
        [integration === "googleCalendar"
          ? "google_calendar"
          : integration === "microsoftCalendar"
            ? "microsoft_calendar"
            : integration === "whatsappBusiness"
              ? "whatsapp_business"
              : integration]: false,
        updated_at: new Date().toISOString(),
      })

      if (error) throw error

      toast.success("Sucesso", `A integração com ${integration} foi desconectada com sucesso.`)
    } catch (error) {
      console.error(`Error disconnecting from ${integration}:`, error)
      toast.error("Erro", `Não foi possível desconectar do ${integration}. Tente novamente.`)
      handleIntegrationSettingsChange(integration, true)
    }
  }

  return (
    <PageShell>
      <PageShell.Header>
        <PageShell.Title>Configurações</PageShell.Title>
        <PageShell.Description>Gerencie as configurações do seu sistema de agendamento</PageShell.Description>
      </PageShell.Header>
      <PageShell.Content>
        <Tabs defaultValue="general">
          <TabsList className="grid grid-cols-4 mb-8">
            <TabsTrigger value="general">
              <Settings className="h-4 w-4 mr-2" />
              Geral
            </TabsTrigger>
            <TabsTrigger value="appointments">
              <Calendar className="h-4 w-4 mr-2" />
              Agendamentos
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              Notificações
            </TabsTrigger>
            <TabsTrigger value="integrations">
              <Share2 className="h-4 w-4 mr-2" />
              Integrações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>Configurações Gerais</CardTitle>
                <CardDescription>Configure as preferências básicas do seu sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoading ? (
                  <div className="space-y-4">
                    {Array(5)
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
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="language">Idioma</Label>
                        <Select
                          value={generalSettings.language}
                          onValueChange={(value) => handleGeneralSettingsChange("language", value)}
                        >
                          <SelectTrigger id="language">
                            <SelectValue placeholder="Selecione um idioma" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                            <SelectItem value="en-US">English (US)</SelectItem>
                            <SelectItem value="es">Español</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="timezone">Fuso horário</Label>
                        <Select
                          value={generalSettings.timezone}
                          onValueChange={(value) => handleGeneralSettingsChange("timezone", value)}
                        >
                          <SelectTrigger id="timezone">
                            <SelectValue placeholder="Selecione um fuso horário" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="America/Sao_Paulo">Brasília (GMT-3)</SelectItem>
                            <SelectItem value="America/Manaus">Manaus (GMT-4)</SelectItem>
                            <SelectItem value="America/Rio_Branco">Rio Branco (GMT-5)</SelectItem>
                            <SelectItem value="America/Noronha">Fernando de Noronha (GMT-2)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dateFormat">Formato de data</Label>
                        <Select
                          value={generalSettings.dateFormat}
                          onValueChange={(value) => handleGeneralSettingsChange("dateFormat", value)}
                        >
                          <SelectTrigger id="dateFormat">
                            <SelectValue placeholder="Selecione um formato de data" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="DD/MM/YYYY">DD/MM/AAAA (31/12/2023)</SelectItem>
                            <SelectItem value="MM/DD/YYYY">MM/DD/AAAA (12/31/2023)</SelectItem>
                            <SelectItem value="YYYY-MM-DD">AAAA-MM-DD (2023-12-31)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="timeFormat">Formato de hora</Label>
                        <Select
                          value={generalSettings.timeFormat}
                          onValueChange={(value) => handleGeneralSettingsChange("timeFormat", value)}
                        >
                          <SelectTrigger id="timeFormat">
                            <SelectValue placeholder="Selecione um formato de hora" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="24h">24 horas (14:30)</SelectItem>
                            <SelectItem value="12h">12 horas (2:30 PM)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="currency">Moeda</Label>
                        <Select
                          value={generalSettings.currency}
                          onValueChange={(value) => handleGeneralSettingsChange("currency", value)}
                        >
                          <SelectTrigger id="currency">
                            <SelectValue placeholder="Selecione uma moeda" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BRL">Real (R$)</SelectItem>
                            <SelectItem value="USD">Dólar (US$)</SelectItem>
                            <SelectItem value="EUR">Euro (€)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  className="bg-[#eb07a4] hover:bg-[#d0069a]"
                  onClick={saveSettings}
                  disabled={isLoading || isSaving}
                >
                  {isSaving ? "Salvando..." : "Salvar alterações"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="appointments">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Agendamento</CardTitle>
                <CardDescription>Configure como os agendamentos funcionam no seu sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoading ? (
                  <div className="space-y-4">
                    {Array(5)
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
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="defaultDuration">Duração padrão (minutos)</Label>
                        <Select
                          value={appointmentSettings.defaultDuration}
                          onValueChange={(value) => handleAppointmentSettingsChange("defaultDuration", value)}
                        >
                          <SelectTrigger id="defaultDuration">
                            <SelectValue placeholder="Selecione a duração padrão" />
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
                        <Label htmlFor="bufferTime">Tempo de intervalo entre agendamentos (minutos)</Label>
                        <Select
                          value={appointmentSettings.bufferTime}
                          onValueChange={(value) => handleAppointmentSettingsChange("bufferTime", value)}
                        >
                          <SelectTrigger id="bufferTime">
                            <SelectValue placeholder="Selecione o tempo de intervalo" />
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

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="allowSameDay">Permitir agendamentos no mesmo dia</Label>
                          <p className="text-sm text-muted-foreground">
                            Permitir que clientes agendem serviços para o mesmo dia
                          </p>
                        </div>
                        <Switch
                          id="allowSameDay"
                          checked={appointmentSettings.allowSameDay}
                          onCheckedChange={(checked) => handleAppointmentSettingsChange("allowSameDay", checked)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="maxDaysInAdvance">Máximo de dias para agendamento antecipado</Label>
                        <Select
                          value={appointmentSettings.maxDaysInAdvance}
                          onValueChange={(value) => handleAppointmentSettingsChange("maxDaysInAdvance", value)}
                        >
                          <SelectTrigger id="maxDaysInAdvance">
                            <SelectValue placeholder="Selecione o número máximo de dias" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="7">7 dias</SelectItem>
                            <SelectItem value="14">14 dias</SelectItem>
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
                            <SelectValue placeholder="Selecione o tempo mínimo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 hora</SelectItem>
                            <SelectItem value="2">2 horas</SelectItem>
                            <SelectItem value="4">4 horas</SelectItem>
                            <SelectItem value="12">12 horas</SelectItem>
                            <SelectItem value="24">24 horas</SelectItem>
                            <SelectItem value="48">48 horas</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  className="bg-[#eb07a4] hover:bg-[#d0069a]"
                  onClick={saveSettings}
                  disabled={isLoading || isSaving}
                >
                  {isSaving ? "Salvando..." : "Salvar alterações"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Notificações</CardTitle>
                <CardDescription>Configure como e quando as notificações são enviadas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoading ? (
                  <div className="space-y-4">
                    {Array(4)
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
                    <div className="grid gap-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="emailReminders">Lembretes por email</Label>
                          <p className="text-sm text-muted-foreground">Enviar lembretes de agendamento por email</p>
                        </div>
                        <Switch
                          id="emailReminders"
                          checked={notificationSettings.emailReminders}
                          onCheckedChange={(checked) => handleNotificationSettingsChange("emailReminders", checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="smsReminders">Lembretes por SMS</Label>
                          <p className="text-sm text-muted-foreground">Enviar lembretes de agendamento por SMS</p>
                        </div>
                        <Switch
                          id="smsReminders"
                          checked={notificationSettings.smsReminders}
                          onCheckedChange={(checked) => handleNotificationSettingsChange("smsReminders", checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="whatsappReminders">Lembretes por WhatsApp</Label>
                          <p className="text-sm text-muted-foreground">Enviar lembretes de agendamento por WhatsApp</p>
                        </div>
                        <Switch
                          id="whatsappReminders"
                          checked={notificationSettings.whatsappReminders}
                          onCheckedChange={(checked) => handleNotificationSettingsChange("whatsappReminders", checked)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="reminderTime">Tempo de antecedência para lembretes (horas)</Label>
                        <Select
                          value={notificationSettings.reminderTime}
                          onValueChange={(value) => handleNotificationSettingsChange("reminderTime", value)}
                        >
                          <SelectTrigger id="reminderTime">
                            <SelectValue placeholder="Selecione o tempo de antecedência" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 hora</SelectItem>
                            <SelectItem value="2">2 horas</SelectItem>
                            <SelectItem value="4">4 horas</SelectItem>
                            <SelectItem value="12">12 horas</SelectItem>
                            <SelectItem value="24">24 horas</SelectItem>
                            <SelectItem value="48">48 horas</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  className="bg-[#eb07a4] hover:bg-[#d0069a]"
                  onClick={saveSettings}
                  disabled={isLoading || isSaving}
                >
                  {isSaving ? "Salvando..." : "Salvar alterações"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="integrations">
            <Card>
              <CardHeader>
                <CardTitle>Integrações</CardTitle>
                <CardDescription>Conecte seu sistema a outros serviços e plataformas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoading ? (
                  <div className="space-y-4">
                    {Array(5)
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
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Calendar className="h-8 w-8 text-blue-500" />
                          <div>
                            <h4 className="text-sm font-medium">Google Calendar</h4>
                            <p className="text-sm text-muted-foreground">
                              Sincronize seus agendamentos com o Google Calendar
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="googleCalendar"
                            checked={integrationSettings.googleCalendar}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                connectIntegration("googleCalendar")
                              } else {
                                disconnectIntegration("googleCalendar")
                              }
                            }}
                          />
                          {!integrationSettings.googleCalendar && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => connectIntegration("googleCalendar")}
                              disabled={!subscription.active}
                            >
                              Conectar
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Calendar className="h-8 w-8 text-blue-600" />
                          <div>
                            <h4 className="text-sm font-medium">Microsoft Calendar</h4>
                            <p className="text-sm text-muted-foreground">
                              Sincronize seus agendamentos com o Microsoft Calendar
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="microsoftCalendar"
                            checked={integrationSettings.microsoftCalendar}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                connectIntegration("microsoftCalendar")
                              } else {
                                disconnectIntegration("microsoftCalendar")
                              }
                            }}
                          />
                          {!integrationSettings.microsoftCalendar && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => connectIntegration("microsoftCalendar")}
                              disabled={!subscription.active}
                            >
                              Conectar
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <MessageSquare className="h-8 w-8 text-green-500" />
                          <div>
                            <h4 className="text-sm font-medium">WhatsApp Business</h4>
                            <p className="text-sm text-muted-foreground">Envie notificações e lembretes via WhatsApp</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="whatsappBusiness"
                            checked={integrationSettings.whatsappBusiness}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                connectIntegration("whatsappBusiness")
                              } else {
                                disconnectIntegration("whatsappBusiness")
                              }
                            }}
                          />
                          {!integrationSettings.whatsappBusiness && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => connectIntegration("whatsappBusiness")}
                              disabled={!subscription.active}
                            >
                              Conectar
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Globe className="h-8 w-8 text-pink-500" />
                          <div>
                            <h4 className="text-sm font-medium">Instagram</h4>
                            <p className="text-sm text-muted-foreground">
                              Conecte sua conta do Instagram para compartilhar agendamentos
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="instagram"
                            checked={integrationSettings.instagram}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                connectIntegration("instagram")
                              } else {
                                disconnectIntegration("instagram")
                              }
                            }}
                          />
                          {!integrationSettings.instagram && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => connectIntegration("instagram")}
                              disabled={!subscription.active}
                            >
                              Conectar
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Globe className="h-8 w-8 text-blue-600" />
                          <div>
                            <h4 className="text-sm font-medium">Facebook</h4>
                            <p className="text-sm text-muted-foreground">
                              Conecte sua página do Facebook para compartilhar agendamentos
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="facebook"
                            checked={integrationSettings.facebook}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                connectIntegration("facebook")
                              } else {
                                disconnectIntegration("facebook")
                              }
                            }}
                          />
                          {!integrationSettings.facebook && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => connectIntegration("facebook")}
                              disabled={!subscription.active}
                            >
                              Conectar
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {!subscription.active && (
                      <div className="mt-6 p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          Para usar as integrações, você precisa ter uma assinatura ativa.
                          <a href="/dashboard/assinatura" className="text-[#eb07a4] ml-1 hover:underline">
                            Assinar agora
                          </a>
                        </p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  className="bg-[#eb07a4] hover:bg-[#d0069a]"
                  onClick={saveSettings}
                  disabled={isLoading || isSaving}
                >
                  {isSaving ? "Salvando..." : "Salvar alterações"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </PageShell.Content>
    </PageShell>
  )
}
