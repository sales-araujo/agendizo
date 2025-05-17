-- Atualizar a tabela user_settings
ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS theme text DEFAULT 'light',
  ADD COLUMN IF NOT EXISTS time_zone text DEFAULT 'America/Sao_Paulo',
  ADD COLUMN IF NOT EXISTS allow_client_reschedule boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_client_cancel boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS require_client_phone boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS require_client_email boolean DEFAULT true; 