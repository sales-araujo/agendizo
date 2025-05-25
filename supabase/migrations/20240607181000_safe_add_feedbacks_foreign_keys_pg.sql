-- Adiciona a coluna client_id se não existir
ALTER TABLE feedbacks
ADD COLUMN IF NOT EXISTS client_id uuid;

-- Adiciona a coluna service_id se não existir
ALTER TABLE feedbacks
ADD COLUMN IF NOT EXISTS service_id uuid;

-- Remove a constraint de client_id se já existir
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'feedbacks_client_id_fkey'
      AND table_name = 'feedbacks'
  ) THEN
    ALTER TABLE feedbacks DROP CONSTRAINT feedbacks_client_id_fkey;
  END IF;
END$$;

-- Adiciona foreign key de feedbacks.client_id para clients.id
ALTER TABLE feedbacks
ADD CONSTRAINT feedbacks_client_id_fkey
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;

-- Remove a constraint de service_id se já existir
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'feedbacks_service_id_fkey'
      AND table_name = 'feedbacks'
  ) THEN
    ALTER TABLE feedbacks DROP CONSTRAINT feedbacks_service_id_fkey;
  END IF;
END$$;

-- Adiciona foreign key de feedbacks.service_id para services.id
ALTER TABLE feedbacks
ADD CONSTRAINT feedbacks_service_id_fkey
FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL; 