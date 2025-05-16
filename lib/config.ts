export const config = {
  resendApiKey: process.env.RESEND_API_KEY,
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
}

// Validação das configurações
if (!config.resendApiKey) {
  console.error('RESEND_API_KEY não está definida nas variáveis de ambiente')
}

if (!config.supabaseUrl || !config.supabaseAnonKey) {
  console.error('Configurações do Supabase não estão definidas nas variáveis de ambiente')
} 