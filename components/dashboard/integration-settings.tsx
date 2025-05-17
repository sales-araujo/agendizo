"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Calendar, Mail, MessageSquare, Instagram, Facebook, Smartphone } from "lucide-react"

export function IntegrationSettings() {
  const [googleCalendarEnabled, setGoogleCalendarEnabled] = useState(false)
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true)
  const [smsNotificationsEnabled, setSmsNotificationsEnabled] = useState(false)
  const [whatsappEnabled, setWhatsappEnabled] = useState(false)
  const [instagramEnabled, setInstagramEnabled] = useState(false)
  const [facebookEnabled, setFacebookEnabled] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const { toast } = useToast()

  const handleGoogleCalendarConnect = async () => {
    try {
      setIsConnecting(true)
      // Simulação de conexão com o Google Calendar
      await new Promise((resolve) => setTimeout(resolve, 1500))

      setGoogleCalendarEnabled(true)
      toast({
        title: "Integração realizada com sucesso",
        description: "Sua conta do Google Calendar foi conectada.",
      })
    } catch (error) {
      toast({
        title: "Erro na integração",
        description: "Não foi possível conectar ao Google Calendar. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsConnecting(false)
    }
  }

  const handleConnect = async (service, setEnabled) => {
    try {
      toast({
        title: "Em breve",
        description: `A integração com ${service} estará disponível em breve!`,
        variant: "warning",
      })
      return
      
      setIsConnecting(true)
      // Simulação de conexão
      await new Promise((resolve) => setTimeout(resolve, 1500))

      setEnabled(true)
      toast({
        title: "Integração realizada com sucesso",
        description: `Sua conta do ${service} foi conectada.`,
      })
    } catch (error) {
      toast({
        title: "Erro na integração",
        description: `Não foi possível conectar ao ${service}. Tente novamente.`,
        variant: "destructive",
      })
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Integrações</h2>
      <p className="text-muted-foreground">Gerencie as integrações do Agendizo com outros serviços.</p>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5 text-blue-500" />
              Google Calendar
            </CardTitle>
            <CardDescription>Sincronize seus agendamentos com o Google Calendar.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label htmlFor="google-calendar">Ativar sincronização</Label>
              <Switch
                id="google-calendar"
                checked={googleCalendarEnabled}
                onCheckedChange={setGoogleCalendarEnabled}
                disabled={!googleCalendarEnabled}
              />
            </div>
          </CardContent>
          <CardFooter>
            {googleCalendarEnabled ? (
              <Button variant="outline" className="w-full" onClick={() => setGoogleCalendarEnabled(false)}>
                Desconectar
              </Button>
            ) : (
              <Button className="w-full" onClick={handleGoogleCalendarConnect} disabled={isConnecting}>
                {isConnecting ? "Conectando..." : "Conectar"}
              </Button>
            )}
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="flex items-center">
              <Mail className="mr-2 h-5 w-5 text-blue-600" />
              Notificações por Email
            </CardTitle>
            <CardDescription>Configure as notificações por email para você e seus clientes.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label htmlFor="email-notifications">Ativar notificações</Label>
              <Switch
                id="email-notifications"
                checked={emailNotificationsEnabled}
                onCheckedChange={setEmailNotificationsEnabled}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" disabled={!emailNotificationsEnabled}>
              Configurar
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="flex items-center">
              <Smartphone className="mr-2 h-5 w-5 text-gray-600" />
              Notificações por SMS
            </CardTitle>
            <CardDescription>Configure as notificações por SMS para você e seus clientes.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label htmlFor="sms-notifications">Ativar notificações</Label>
              <Switch
                id="sms-notifications"
                checked={smsNotificationsEnabled}
                onCheckedChange={setSmsNotificationsEnabled}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" disabled={!smsNotificationsEnabled}>
              Configurar
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="flex items-center">
              <MessageSquare className="mr-2 h-5 w-5 text-green-500" />
              WhatsApp Business
            </CardTitle>
            <CardDescription>Conecte-se ao WhatsApp Business para enviar notificações.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label htmlFor="whatsapp">Ativar integração</Label>
              <Switch
                id="whatsapp"
                checked={whatsappEnabled}
                onCheckedChange={setWhatsappEnabled}
                disabled={!whatsappEnabled}
              />
            </div>
          </CardContent>
          <CardFooter>
            {whatsappEnabled ? (
              <Button variant="outline" className="w-full" onClick={() => setWhatsappEnabled(false)}>
                Desconectar
              </Button>
            ) : (
              <Button
                className="w-full"
                onClick={() => handleConnect("WhatsApp Business", setWhatsappEnabled)}
                disabled={isConnecting}
              >
                {isConnecting ? "Conectando..." : "Conectar"}
              </Button>
            )}
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="flex items-center">
              <Instagram className="mr-2 h-5 w-5 text-pink-500" />
              Instagram
            </CardTitle>
            <CardDescription>Conecte sua conta do Instagram para compartilhar agendamentos.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label htmlFor="instagram">Ativar integração</Label>
              <Switch
                id="instagram"
                checked={instagramEnabled}
                onCheckedChange={setInstagramEnabled}
                disabled={!instagramEnabled}
              />
            </div>
          </CardContent>
          <CardFooter>
            {instagramEnabled ? (
              <Button variant="outline" className="w-full" onClick={() => setInstagramEnabled(false)}>
                Desconectar
              </Button>
            ) : (
              <Button
                className="w-full"
                onClick={() => handleConnect("Instagram", setInstagramEnabled)}
                disabled={isConnecting}
              >
                {isConnecting ? "Conectando..." : "Conectar"}
              </Button>
            )}
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="flex items-center">
              <Facebook className="mr-2 h-5 w-5 text-blue-600" />
              Facebook
            </CardTitle>
            <CardDescription>Conecte sua página do Facebook para compartilhar agendamentos.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label htmlFor="facebook">Ativar integração</Label>
              <Switch
                id="facebook"
                checked={facebookEnabled}
                onCheckedChange={setFacebookEnabled}
                disabled={!facebookEnabled}
              />
            </div>
          </CardContent>
          <CardFooter>
            {facebookEnabled ? (
              <Button variant="outline" className="w-full" onClick={() => setFacebookEnabled(false)}>
                Desconectar
              </Button>
            ) : (
              <Button
                className="w-full"
                onClick={() => handleConnect("Facebook", setFacebookEnabled)}
                disabled={isConnecting}
              >
                {isConnecting ? "Conectando..." : "Conectar"}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
