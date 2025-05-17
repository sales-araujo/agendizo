-- Criar a tabela businesses
CREATE TABLE IF NOT EXISTS businesses (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  type text,
  address text,
  city text,
  state text,
  zip_code text,
  country text,
  phone text,
  email text,
  website text,
  logo_url text,
  banner_url text,
  logo_size text,
  primary_color text,
  secondary_color text,
  font_family text,
  theme text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(slug)
);

-- Criar trigger para atualizar o updated_at automaticamente se não existir
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_businesses_updated_at'
  ) THEN
    CREATE TRIGGER update_businesses_updated_at
      BEFORE UPDATE ON businesses
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$; 