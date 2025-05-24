-- Cria a tabela dashboard_theme_settings
CREATE TABLE IF NOT EXISTS public.dashboard_theme_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  theme VARCHAR(10) NOT NULL DEFAULT 'light',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id)
);

-- Adiciona RLS (Row Level Security)
ALTER TABLE public.dashboard_theme_settings ENABLE ROW LEVEL SECURITY;

-- Cria políticas de segurança (se não existirem)
DO $$ 
BEGIN
    -- Política de SELECT
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'dashboard_theme_settings' 
        AND policyname = 'Users can view their own theme settings'
    ) THEN
        CREATE POLICY "Users can view their own theme settings"
        ON public.dashboard_theme_settings FOR SELECT
        USING (auth.uid() = user_id);
    END IF;

    -- Política de INSERT
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'dashboard_theme_settings' 
        AND policyname = 'Users can insert their own theme settings'
    ) THEN
        CREATE POLICY "Users can insert their own theme settings"
        ON public.dashboard_theme_settings FOR INSERT
        WITH CHECK (auth.uid() = user_id);
    END IF;

    -- Política de UPDATE
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'dashboard_theme_settings' 
        AND policyname = 'Users can update their own theme settings'
    ) THEN
        CREATE POLICY "Users can update their own theme settings"
        ON public.dashboard_theme_settings FOR UPDATE
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
    END IF;

    -- Política de DELETE
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'dashboard_theme_settings' 
        AND policyname = 'Users can delete their own theme settings'
    ) THEN
        CREATE POLICY "Users can delete their own theme settings"
        ON public.dashboard_theme_settings FOR DELETE
        USING (auth.uid() = user_id);
    END IF;
END $$;

-- Garante que a tabela seja criada no schema public
SET search_path TO public; 