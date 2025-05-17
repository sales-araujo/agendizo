-- Adicionar coluna category à tabela businesses
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS category VARCHAR(255);

-- Criar um tipo enum para as categorias de negócio
DO $$ BEGIN
    CREATE TYPE business_category AS ENUM (
        'salao',
        'barbearia',
        'estetica',
        'spa',
        'clinica',
        'odontologia',
        'fisioterapia',
        'psicologia',
        'advocacia',
        'consultoria',
        'outros'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Alterar a coluna category para usar o tipo enum
ALTER TABLE businesses ALTER COLUMN category TYPE business_category USING category::business_category; 