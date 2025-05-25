-- Adiciona a coluna client_id se não existir
ALTER TABLE feedbacks
ADD COLUMN IF NOT EXISTS client_id uuid;

-- Adiciona a coluna service_id se não existir
ALTER TABLE feedbacks
ADD COLUMN IF NOT EXISTS service_id uuid;

-- Adiciona foreign key de feedbacks.client_id para clients.id
ALTER TABLE feedbacks
ADD CONSTRAINT IF NOT EXISTS feedbacks_client_id_fkey
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;

-- Adiciona foreign key de feedbacks.service_id para services.id
ALTER TABLE feedbacks
ADD CONSTRAINT IF NOT EXISTS feedbacks_service_id_fkey
FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL; 