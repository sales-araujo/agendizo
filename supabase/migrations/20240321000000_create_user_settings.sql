-- Criar a tabela user_settings
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  language text DEFAULT 'pt-BR',
  currency text DEFAULT 'BRL',
  theme text DEFAULT 'light',
  time_zone text DEFAULT 'America/Sao_Paulo',
  default_duration integer DEFAULT 60,
  buffer_time integer DEFAULT 15,
  allow_same_day boolean DEFAULT true,
  max_days_in_advance integer DEFAULT 30,
  min_time_before_cancel integer DEFAULT 24,
  allow_client_reschedule boolean DEFAULT true,
  allow_client_cancel boolean DEFAULT true,
  require_client_phone boolean DEFAULT true,
  require_client_email boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id)
);

-- Criar trigger para atualizar o updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 