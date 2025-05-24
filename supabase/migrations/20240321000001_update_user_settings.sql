-- Criar a tabela user_settings se ela não existir
CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    currency TEXT DEFAULT 'BRL',
    theme TEXT DEFAULT 'light',
    time_zone TEXT DEFAULT 'America/Sao_Paulo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, business_id)
);

-- Adicionar políticas de segurança
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam apenas suas próprias configurações
CREATE POLICY "Users can view their own settings"
    ON public.user_settings
    FOR SELECT
    USING (auth.uid() = user_id);

-- Política para permitir que usuários atualizem apenas suas próprias configurações
CREATE POLICY "Users can update their own settings"
    ON public.user_settings
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Política para permitir que usuários insiram suas próprias configurações
CREATE POLICY "Users can insert their own settings"
    ON public.user_settings
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Política para permitir que usuários deletem suas próprias configurações
CREATE POLICY "Users can delete their own settings"
    ON public.user_settings
    FOR DELETE
    USING (auth.uid() = user_id);

-- Criar índices para melhorar a performance
CREATE INDEX IF NOT EXISTS user_settings_user_id_idx ON public.user_settings(user_id);
CREATE INDEX IF NOT EXISTS user_settings_business_id_idx ON public.user_settings(business_id);

-- Atualizar a tabela user_settings
ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS allow_client_reschedule boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_client_cancel boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS require_client_phone boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS require_client_email boolean DEFAULT true; 