-- Remover a restrição UNIQUE de user_id se existir
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_settings_user_id_key'
  ) THEN
    ALTER TABLE user_settings DROP CONSTRAINT user_settings_user_id_key;
  END IF;
END $$;

-- Adicionar coluna business_id se não existir
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_settings' AND column_name = 'business_id'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN business_id uuid REFERENCES businesses(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Adicionar restrição UNIQUE para user_id + business_id se não existir
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_settings_user_business_unique'
  ) THEN
    ALTER TABLE user_settings ADD CONSTRAINT user_settings_user_business_unique UNIQUE (user_id, business_id);
  END IF;
END $$;

-- Atualizar registros existentes
UPDATE user_settings us
SET business_id = (
  SELECT id FROM businesses b
  WHERE b.owner_id = us.user_id
  LIMIT 1
)
WHERE business_id IS NULL; 