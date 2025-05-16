-- Criar tabela de perfis se não existir
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  bio TEXT,
  website TEXT,
  social_media JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar função para criar perfil automaticamente quando um usuário é criado
CREATE OR REPLACE FUNCTION public.create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para criar perfil automaticamente
DROP TRIGGER IF EXISTS create_profile_trigger ON auth.users;
CREATE TRIGGER create_profile_trigger
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.create_profile_for_user();

-- Criar função para criar tabela working_hours
CREATE OR REPLACE FUNCTION public.create_working_hours_table()
RETURNS VOID AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS public.working_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    is_working_day BOOLEAN NOT NULL DEFAULT true,
    start_time TIME NOT NULL DEFAULT '09:00',
    end_time TIME NOT NULL DEFAULT '17:00',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (business_id, day_of_week)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
