-- Adiciona foreign key de feedbacks.client_id para clients.id
ALTER TABLE feedbacks
ADD CONSTRAINT feedbacks_client_id_fkey
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;

-- Adiciona foreign key de feedbacks.service_id para services.id
ALTER TABLE feedbacks
ADD CONSTRAINT feedbacks_service_id_fkey
FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL; 