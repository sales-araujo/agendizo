-- Criar tabela de configurações
CREATE TABLE IF NOT EXISTS public.app_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir configuração do Resend
INSERT INTO public.app_config (key, value, description)
VALUES (
    'resend_api_key',
    're_hyHHawrp_6aW3bQCL2GmLvJ1gL4jjRVYj',
    'API Key do Resend para envio de emails'
) ON CONFLICT (key) DO UPDATE 
SET value = EXCLUDED.value,
    updated_at = NOW();

-- Criar função para obter configuração
CREATE OR REPLACE FUNCTION get_config(p_key TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_value TEXT;
BEGIN
    SELECT value INTO v_value
    FROM public.app_config
    WHERE key = p_key;
    
    RETURN v_value;
END;
$$; 