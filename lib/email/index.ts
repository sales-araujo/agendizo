import { createClient } from "@/lib/supabase/server"

interface EmailTemplateProps {
  businessName: string
  clientName: string
  serviceName: string
  date: string
  time: string
  price: number
}

export async function sendNewAppointmentEmail(to: string, props: EmailTemplateProps) {
  try {
    const { businessName, clientName, serviceName, date, time, price } = props
    const supabase = createClient()
    
    const { error } = await supabase.functions.invoke('send-email', {
      body: {
        to,
        subject: `Novo agendamento confirmado - ${businessName}`,
        template: 'new-appointment',
        data: {
          businessName,
          clientName,
          serviceName,
          date,
          time,
          price: price.toFixed(2)
        }
      }
    })

    if (error) {
      console.error('Erro ao enviar email de novo agendamento:', error)
      throw error
    }

    return true
  } catch (error) {
    console.error('Erro ao enviar email de novo agendamento:', error)
    throw error
  }
}

export async function sendAppointmentReminderEmail(to: string, props: EmailTemplateProps) {
  try {
    const { businessName, clientName, serviceName, date, time } = props
    const supabase = createClient()
    
    const { error } = await supabase.functions.invoke('send-email', {
      body: {
        to,
        subject: `Lembrete de agendamento - ${businessName}`,
        template: 'appointment-reminder',
        data: {
          businessName,
          clientName,
          serviceName,
          date,
          time
        }
      }
    })

    if (error) {
      console.error('Erro ao enviar email de lembrete:', error)
      throw error
    }

    return true
  } catch (error) {
    console.error('Erro ao enviar email de lembrete:', error)
    throw error
  }
}

export async function sendAppointmentCancelledEmail(to: string, props: EmailTemplateProps) {
  try {
    const { businessName, clientName, serviceName, date, time } = props
    const supabase = createClient()
    
    const { error } = await supabase.functions.invoke('send-email', {
      body: {
        to,
        subject: `Agendamento cancelado - ${businessName}`,
        template: 'appointment-cancelled',
        data: {
          businessName,
          clientName,
          serviceName,
          date,
          time
        }
      }
    })

    if (error) {
      console.error('Erro ao enviar email de cancelamento:', error)
      throw error
    }

    return true
  } catch (error) {
    console.error('Erro ao enviar email de cancelamento:', error)
    throw error
  }
} 