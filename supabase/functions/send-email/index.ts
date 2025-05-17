// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// Declaração dos tipos do Deno
declare global {
  namespace Deno {
    interface Env {
      get(key: string): string | undefined
    }
    var env: Env
  }
}

interface RequestEvent {
  method: string
  headers: Headers
  json(): Promise<any>
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  to: string
  subject: string
  template: 'new-appointment' | 'appointment-reminder' | 'appointment-cancelled'
  data: {
    businessName: string
    clientName: string
    serviceName: string
    date: string
    time: string
    price?: string
  }
}

const templates = {
  'new-appointment': (data: EmailRequest['data']) => `
    <h1>Seu agendamento foi confirmado!</h1>
    <p>Olá ${data.clientName},</p>
    <p>Seu agendamento foi confirmado com sucesso:</p>
    <ul>
      <li><strong>Estabelecimento:</strong> ${data.businessName}</li>
      <li><strong>Serviço:</strong> ${data.serviceName}</li>
      <li><strong>Data:</strong> ${data.date}</li>
      <li><strong>Horário:</strong> ${data.time}</li>
      ${data.price ? `<li><strong>Valor:</strong> R$ ${data.price}</li>` : ''}
    </ul>
    <p>Agradecemos a preferência!</p>
  `,
  'appointment-reminder': (data: EmailRequest['data']) => `
    <h1>Lembrete de agendamento</h1>
    <p>Olá ${data.clientName},</p>
    <p>Este é um lembrete do seu agendamento:</p>
    <ul>
      <li><strong>Estabelecimento:</strong> ${data.businessName}</li>
      <li><strong>Serviço:</strong> ${data.serviceName}</li>
      <li><strong>Data:</strong> ${data.date}</li>
      <li><strong>Horário:</strong> ${data.time}</li>
    </ul>
    <p>Até logo!</p>
  `,
  'appointment-cancelled': (data: EmailRequest['data']) => `
    <h1>Agendamento cancelado</h1>
    <p>Olá ${data.clientName},</p>
    <p>Seu agendamento foi cancelado:</p>
    <ul>
      <li><strong>Estabelecimento:</strong> ${data.businessName}</li>
      <li><strong>Serviço:</strong> ${data.serviceName}</li>
      <li><strong>Data:</strong> ${data.date}</li>
      <li><strong>Horário:</strong> ${data.time}</li>
    </ul>
    <p>Se você não solicitou este cancelamento, entre em contato com o estabelecimento.</p>
  `
}

serve(async (req: RequestEvent) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Não autorizado')
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authError || !user) {
      throw new Error('Não autorizado')
    }

    // Obter dados do request
    const { to, subject, template, data } = await req.json() as EmailRequest

    // Verificar dados obrigatórios
    if (!to || !subject || !template || !data) {
      throw new Error('Dados inválidos')
    }

    // Gerar HTML do email
    const html = templates[template](data)

    // Enviar email usando o serviço de email do Supabase
    const { error } = await supabaseClient.functions.invoke('send-email-internal', {
      body: {
        to,
        subject,
        html
      }
    })

    if (error) throw error

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
}) 