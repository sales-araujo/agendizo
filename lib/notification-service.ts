import { createClient } from './supabase/client'
import { sendAppointmentConfirmationEmail, sendAppointmentReminderEmail, sendAppointmentCancellationEmail } from './email-service'

interface NotificationSettings {
  email_new_appointment: boolean
  email_reminder: boolean
  email_cancellation: boolean
  sms_new_appointment: boolean
  sms_reminder: boolean
  sms_cancellation: boolean
  whatsapp_new_appointment: boolean
  whatsapp_reminder: boolean
  whatsapp_cancellation: boolean
}

interface AppointmentDetails {
  serviceName: string
  date: string
  time: string
  businessName: string
  businessAddress: string
}

export async function sendNotification(
  userId: string,
  type: 'new_appointment' | 'reminder' | 'cancellation',
  appointmentDetails: AppointmentDetails,
  userEmail: string
) {
  try {
    const supabase = createClient()

    // Buscar configurações de notificação do usuário
    const { data: settings, error: settingsError } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (settingsError) {
      console.error('Erro ao buscar configurações de notificação:', settingsError)
      throw settingsError
    }

    if (!settings) {
      console.error('Configurações de notificação não encontradas')
      return
    }

    const notificationSettings = settings as NotificationSettings

    // Enviar notificações de acordo com as configurações
    const promises: Promise<any>[] = []

    // Email
    if (
      (type === 'new_appointment' && notificationSettings.email_new_appointment) ||
      (type === 'reminder' && notificationSettings.email_reminder) ||
      (type === 'cancellation' && notificationSettings.email_cancellation)
    ) {
      switch (type) {
        case 'new_appointment':
          promises.push(sendAppointmentConfirmationEmail(userEmail, appointmentDetails))
          break
        case 'reminder':
          promises.push(sendAppointmentReminderEmail(userEmail, appointmentDetails))
          break
        case 'cancellation':
          promises.push(sendAppointmentCancellationEmail(userEmail, appointmentDetails))
          break
      }
    }

    // TODO: Implementar envio de SMS e WhatsApp
    // Por enquanto, apenas registramos no log
    if (
      (type === 'new_appointment' && notificationSettings.sms_new_appointment) ||
      (type === 'reminder' && notificationSettings.sms_reminder) ||
      (type === 'cancellation' && notificationSettings.sms_cancellation)
    ) {
      console.log('SMS notification would be sent:', { type, appointmentDetails })
    }

    if (
      (type === 'new_appointment' && notificationSettings.whatsapp_new_appointment) ||
      (type === 'reminder' && notificationSettings.whatsapp_reminder) ||
      (type === 'cancellation' && notificationSettings.whatsapp_cancellation)
    ) {
      console.log('WhatsApp notification would be sent:', { type, appointmentDetails })
    }

    // Registrar a notificação no histórico
    const { error: notificationError } = await supabase.from('notifications').insert({
      user_id: userId,
      type,
      status: 'sent',
      details: appointmentDetails,
    })

    if (notificationError) {
      console.error('Erro ao registrar notificação:', notificationError)
    }

    // Aguardar o envio de todas as notificações
    await Promise.all(promises)
  } catch (error) {
    console.error('Erro ao enviar notificação:', error)
    throw error
  }
} 