-- Primeiro pegar o business_id do usuário logado
WITH business AS (
  SELECT id, owner_id 
  FROM businesses 
  WHERE owner_id = auth.uid() 
  LIMIT 1
),
-- Inserir cliente de teste
new_client AS (
  INSERT INTO clients (id, name, email, phone, business_id)
  SELECT
    gen_random_uuid(),
    'Cliente Teste',
    'sales.correia@hotmail.com',
    '11999999999',
    business.id
  FROM business
  RETURNING id
)
-- Inserir agendamento de teste
INSERT INTO appointments (
  id,
  business_id,
  client_id,
  service_id,
  start_time,
  end_time,
  status,
  created_at
)
SELECT
  gen_random_uuid(),
  business.id,
  new_client.id,
  services.id,
  NOW() + interval '1 hour',
  NOW() + interval '2 hours',
  'confirmed',
  NOW()
FROM business, services, new_client
WHERE services.business_id = business.id
LIMIT 1; 