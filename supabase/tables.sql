-- Tabela de configurações do usuário
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language VARCHAR(10) DEFAULT 'pt-BR',
  timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
  date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
  time_format VARCHAR(10) DEFAULT '24h',
  currency VARCHAR(10) DEFAULT 'BRL',
  default_duration INTEGER DEFAULT 60,
  buffer_time INTEGER DEFAULT 15,
  allow_same_day BOOLEAN DEFAULT TRUE,
  max_days_in_advance INTEGER DEFAULT 30,
  min_time_before_cancel INTEGER DEFAULT 24,
  email_reminders BOOLEAN DEFAULT TRUE,
  sms_reminders BOOLEAN DEFAULT FALSE,
  whatsapp_reminders BOOLEAN DEFAULT TRUE,
  reminder_time INTEGER DEFAULT 24,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Tabela de integrações
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  google_calendar BOOLEAN DEFAULT FALSE,
  microsoft_calendar BOOLEAN DEFAULT FALSE,
  whatsapp_business BOOLEAN DEFAULT FALSE,
  instagram BOOLEAN DEFAULT FALSE,
  facebook BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Tabela de notificações
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read BOOLEAN DEFAULT FALSE,
  type VARCHAR(50) DEFAULT 'system',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de configurações de notificação
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email BOOLEAN DEFAULT TRUE,
  sms BOOLEAN DEFAULT FALSE,
  whatsapp BOOLEAN DEFAULT TRUE,
  appointment_reminders BOOLEAN DEFAULT TRUE,
  marketing_messages BOOLEAN DEFAULT FALSE,
  system_updates BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Adicionar coluna slug à tabela businesses se não existir
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE;

-- Adicionar campos sociais ao perfil
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_name VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS category VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS facebook VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS twitter VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS instagram VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(255);
