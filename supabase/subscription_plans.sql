-- Criar tabela de planos de assinatura se não existir
CREATE TABLE IF NOT EXISTS subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  stripe_price_id_monthly TEXT NOT NULL,
  stripe_price_id_yearly TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Limpar dados existentes
DELETE FROM subscription_plans;

-- Inserir planos
INSERT INTO subscription_plans (id, name, description, stripe_price_id_monthly, stripe_price_id_yearly)
VALUES 
  ('basic', 'Básico', 'Ideal para profissionais autônomos', 'price_1RO2wECKUAMtAv3pNcr4wPS1', 'price_1RO30rCKUAMtAv3pv9aglU7I'),
  ('pro', 'Profissional', 'Perfeito para pequenas empresas', 'price_1RO32fCKUAMtAv3ptScKd7AT', 'price_1RO33KCKUAMtAv3pi20nmCYQ'),
  ('enterprise', 'Enterprise', 'Para empresas em crescimento', 'price_1RO34jCKUAMtAv3p6J2fk4D1', 'price_1RO3A1CKUAMtAv3pdQuEP7xM');
