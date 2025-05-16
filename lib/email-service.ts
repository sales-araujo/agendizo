import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function sendEmail(to: string, subject: string, html: string) {
  try {
    const { error } = await supabase.functions.invoke('send-email', {
      body: { to, subject, html }
    })

    if (error) {
      console.error('Erro ao enviar email:', error)
      throw error
    }

    return true
  } catch (error) {
    console.error('Erro ao enviar email:', error)
    throw error
  }
}

export async function sendAppointmentEmail(
  to: string,
  type: 'new' | 'reminder' | 'cancelled',
  appointmentData: {
    date: string
    time: string
    service: string
    clientName: string
  }
) {
  const templates = {
    new: {
      subject: 'Novo Agendamento Confirmado',
      html: `
        <h1>Novo Agendamento Confirmado</h1>
        <p>Olá ${appointmentData.clientName},</p>
        <p>Seu agendamento foi confirmado:</p>
        <ul>
          <li>Data: ${appointmentData.date}</li>
          <li>Horário: ${appointmentData.time}</li>
          <li>Serviço: ${appointmentData.service}</li>
        </ul>
      `
    },
    reminder: {
      subject: 'Lembrete de Agendamento',
      html: `
        <h1>Lembrete de Agendamento</h1>
        <p>Olá ${appointmentData.clientName},</p>
        <p>Lembrete do seu agendamento:</p>
        <ul>
          <li>Data: ${appointmentData.date}</li>
          <li>Horário: ${appointmentData.time}</li>
          <li>Serviço: ${appointmentData.service}</li>
        </ul>
      `
    },
    cancelled: {
      subject: 'Agendamento Cancelado',
      html: `
        <h1>Agendamento Cancelado</h1>
        <p>Olá ${appointmentData.clientName},</p>
        <p>Seu agendamento foi cancelado:</p>
        <ul>
          <li>Data: ${appointmentData.date}</li>
          <li>Horário: ${appointmentData.time}</li>
          <li>Serviço: ${appointmentData.service}</li>
        </ul>
      `
    }
  }

  const template = templates[type]
  return sendEmail(to, template.subject, template.html)
} 