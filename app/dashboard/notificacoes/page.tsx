"use client"

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Mail, MessageSquare, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import AuthCheck from './auth-check'

interface NotificationSettings {
  email_new_appointment: boolean
  email_appointment_reminder: boolean
  email_appointment_cancelled: boolean
  sms_new_appointment: boolean
  sms_appointment_reminder: boolean
  sms_appointment_cancelled: boolean
  whatsapp_new_appointment: boolean
  whatsapp_appointment_reminder: boolean
  whatsapp_appointment_cancelled: boolean
}

export default function NotificationsPage() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchNotificationSettings()
  }, [])

  async function fetchNotificationSettings() {
    try {
      setIsLoading(true)
      setError(null)

      // Verificar autenticação
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        console.error('Erro ao obter usuário:', {
          message: userError.message,
          status: userError.status,
          name: userError.name
        })
        setError('Erro ao verificar autenticação')
        return
      }

      if (!user) {
        console.error('Usuário não autenticado')
        setError('Usuário não autenticado')
        return
      }

      console.log('Usuário autenticado:', {
        id: user.id,
        email: user.email
      })

      // Verificar se a tabela existe e tem as colunas corretas
      const { data: tableInfo, error: tableError } = await supabase
        .from('notification_settings')
        .select('*')
        .limit(0)

      if (tableError) {
        console.error('Erro ao verificar tabela:', {
          message: tableError.message,
          code: tableError.code,
          details: tableError.details,
          hint: tableError.hint
        })
        setError(`Erro ao acessar a tabela de configurações: ${tableError.message}`)
        return
      }

      console.log('Tabela verificada com sucesso')

      // Buscar configurações do usuário
      const { data, error: settingsError } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (settingsError) {
        console.error('Erro ao buscar configurações:', {
          message: settingsError.message,
          code: settingsError.code,
          details: settingsError.details,
          hint: settingsError.hint,
          user_id: user.id
        })
        
        // Se a tabela não existe ou não tem permissão
        if (settingsError.code === '42P01' || settingsError.code === '42501') {
          setError('Erro de acesso ao banco de dados. Por favor, verifique as permissões.')
          return
        }

        // Se não encontrou configurações, cria um registro padrão
        if (settingsError.code === 'PGRST116') {
          console.log('Criando configurações padrão para o usuário:', user.id)
          
          const defaultSettings = {
            user_id: user.id,
            email_new_appointment: true,
            email_appointment_reminder: true,
            email_appointment_cancelled: true,
            sms_new_appointment: false,
            sms_appointment_reminder: false,
            sms_appointment_cancelled: false,
            whatsapp_new_appointment: false,
            whatsapp_appointment_reminder: false,
            whatsapp_appointment_cancelled: false
          }

          console.log('Tentando inserir configurações padrão:', defaultSettings)

          const { data: insertData, error: insertError } = await supabase
            .from('notification_settings')
            .insert([defaultSettings])
            .select()

          if (insertError) {
            console.error('Erro ao criar configurações padrão:', {
              message: insertError.message,
              code: insertError.code,
              details: insertError.details,
              hint: insertError.hint,
              user_id: user.id,
              settings: defaultSettings
            })
            setError(`Erro ao criar configurações padrão: ${insertError.message}`)
            return
          }

          console.log('Configurações padrão criadas com sucesso:', insertData)
          setSettings(defaultSettings)
          return
        }

        setError(`Erro ao carregar configurações: ${settingsError.message}`)
        return
      }

      console.log('Configurações carregadas com sucesso:', data)
      setSettings(data)
    } catch (error) {
      console.error('Erro ao carregar configurações:', {
        error,
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined
      })
      setError(error instanceof Error ? error.message : 'Erro inesperado ao carregar configurações')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSettingChange(setting: keyof NotificationSettings, value: boolean) {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        console.error('Erro ao obter usuário:', userError)
        toast.error('Erro ao verificar autenticação')
        return
      }

      // Atualiza o estado local primeiro para feedback imediato
      setSettings(prev => prev ? { ...prev, [setting]: value } : null)

      const { error: updateError } = await supabase
        .from('notification_settings')
        .update({ [setting]: value })
        .eq('user_id', user.id)

      if (updateError) {
        console.error('Erro ao atualizar configuração:', updateError)
        // Reverte a mudança no estado local
        setSettings(prev => prev ? { ...prev, [setting]: !value } : null)
        toast.error('Erro ao atualizar configuração')
        return
      }

      toast.success('Configuração atualizada com sucesso')
    } catch (error) {
      console.error('Erro ao atualizar configuração:', error)
      toast.error('Erro ao atualizar configuração')
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
        <Button 
          className="mt-4"
          onClick={fetchNotificationSettings}
        >
          Tentar novamente
        </Button>
      </div>
    )
  }

  return (
    <>
      <AuthCheck />
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">Configurações de Notificações</h1>
        
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Informação</AlertTitle>
          <AlertDescription>
            As notificações por email são enviadas automaticamente pelo sistema. 
            As notificações por SMS e WhatsApp serão implementadas em breve.
          </AlertDescription>
        </Alert>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Notificações por Email
              </CardTitle>
              <CardDescription>
                Configure suas preferências de notificação por email
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="email_new_appointment">Novo agendamento</Label>
                <Switch
                  id="email_new_appointment"
                  checked={settings?.email_new_appointment}
                  onCheckedChange={(checked) => handleSettingChange('email_new_appointment', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="email_appointment_reminder">Lembrete de agendamento</Label>
                <Switch
                  id="email_appointment_reminder"
                  checked={settings?.email_appointment_reminder}
                  onCheckedChange={(checked) => handleSettingChange('email_appointment_reminder', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="email_appointment_cancelled">Agendamento cancelado</Label>
                <Switch
                  id="email_appointment_cancelled"
                  checked={settings?.email_appointment_cancelled}
                  onCheckedChange={(checked) => handleSettingChange('email_appointment_cancelled', checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="opacity-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Notificações por SMS
              </CardTitle>
              <CardDescription>
                Em breve: Configure suas preferências de notificação por SMS
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="sms_new_appointment">Novo agendamento</Label>
                <Switch
                  id="sms_new_appointment"
                  checked={false}
                  disabled
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="sms_appointment_reminder">Lembrete de agendamento</Label>
                <Switch
                  id="sms_appointment_reminder"
                  checked={false}
                  disabled
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="sms_appointment_cancelled">Agendamento cancelado</Label>
                <Switch
                  id="sms_appointment_cancelled"
                  checked={false}
                  disabled
                />
              </div>
            </CardContent>
          </Card>

          <Card className="opacity-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Notificações por WhatsApp
              </CardTitle>
              <CardDescription>
                Em breve: Configure suas preferências de notificação por WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="whatsapp_new_appointment">Novo agendamento</Label>
                <Switch
                  id="whatsapp_new_appointment"
                  checked={false}
                  disabled
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="whatsapp_appointment_reminder">Lembrete de agendamento</Label>
                <Switch
                  id="whatsapp_appointment_reminder"
                  checked={false}
                  disabled
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="whatsapp_appointment_cancelled">Agendamento cancelado</Label>
                <Switch
                  id="whatsapp_appointment_cancelled"
                  checked={false}
                  disabled
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
