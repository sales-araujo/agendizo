-- Criar tabela de feedbacks se não existir
CREATE TABLE IF NOT EXISTS feedbacks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_email TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para melhorar a performance das consultas
CREATE INDEX IF NOT EXISTS feedbacks_business_id_idx ON feedbacks(business_id);
CREATE INDEX IF NOT EXISTS feedbacks_rating_idx ON feedbacks(rating);
CREATE INDEX IF NOT EXISTS feedbacks_created_at_idx ON feedbacks(created_at);

-- Adicionar alguns feedbacks de exemplo
INSERT INTO feedbacks (business_id, client_name, client_email, rating, comment, created_at)
SELECT 
  b.id,
  'Maria Silva',
  'maria.silva@exemplo.com',
  5,
  'Excelente atendimento! Fiquei muito satisfeita com o serviço.',
  NOW() - INTERVAL '2 days'
FROM businesses b
LIMIT 1;

INSERT INTO feedbacks (business_id, client_name, client_email, rating, comment, created_at)
SELECT 
  b.id,
  'João Pereira',
  'joao.pereira@exemplo.com',
  4,
  'Bom serviço, mas poderia melhorar o tempo de espera.',
  NOW() - INTERVAL '5 days'
FROM businesses b
LIMIT 1;

INSERT INTO feedbacks (business_id, client_name, client_email, rating, comment, created_at)
SELECT 
  b.id,
  'Ana Costa',
  'ana.costa@exemplo.com',
  5,
  'Profissionais muito atenciosos e competentes. Recomendo!',
  NOW() - INTERVAL '1 week'
FROM businesses b
LIMIT 1;
