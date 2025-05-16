import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { type, userId } = await request.json()

    if (!type || !userId) {
      return NextResponse.json(
        { error: 'Tipo de notificação e ID do usuário são obrigatórios' },
        { status: 400 }
      )
    }

    // Verifica se o usuário tem permissão para enviar a notificação
    if (user.id !== userId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403 }
      )
    }

    // Busca as configurações de notificação do usuário
    const { data: settings, error: settingsError } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (settingsError) {
      return NextResponse.json(
        { error: 'Erro ao buscar configurações de notificação' },
        { status: 500 }
      )
    }

    // Verifica se a notificação está habilitada
    if (!settings[type]) {
      return NextResponse.json(
        { error: 'Esta notificação está desabilitada' },
        { status: 400 }
      )
    }

    // Envia o email de teste
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'Agendizo <noreply@agendizo.com>',
      to: user.email!,
      subject: 'Teste de Notificação - Agendizo',
      html: `
        <h1>Teste de Notificação</h1>
        <p>Esta é uma notificação de teste do Agendizo.</p>
        <p>Tipo de notificação: ${type}</p>
        <p>Data e hora: ${new Date().toLocaleString()}</p>
      `
    })

    if (emailError) {
      return NextResponse.json(
        { error: 'Erro ao enviar email de teste' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, emailData })
  } catch (error) {
    console.error('Erro ao processar notificação de teste:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 