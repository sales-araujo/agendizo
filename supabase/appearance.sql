-- Create business_appearance table
CREATE TABLE IF NOT EXISTS business_appearance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  theme_color TEXT NOT NULL DEFAULT 'default',
  theme_mode TEXT NOT NULL DEFAULT 'system',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(business_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_business_appearance_business_id ON business_appearance(business_id);

-- Add RLS policies
ALTER TABLE business_appearance ENABLE ROW LEVEL SECURITY;

-- Policy for select
CREATE POLICY select_business_appearance ON business_appearance
  FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

-- Policy for insert
CREATE POLICY insert_business_appearance ON business_appearance
  FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

-- Policy for update
CREATE POLICY update_business_appearance ON business_appearance
  FOR UPDATE
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

-- Policy for delete
CREATE POLICY delete_business_appearance ON business_appearance
  FOR DELETE
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );
