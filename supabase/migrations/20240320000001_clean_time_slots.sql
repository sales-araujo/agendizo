-- Drop existing table and sequence
DROP TABLE IF EXISTS time_slots CASCADE;
DROP SEQUENCE IF EXISTS time_slots_id_seq;

-- Create new sequence
CREATE SEQUENCE time_slots_id_seq;

-- Create table with proper structure
CREATE TABLE time_slots (
  id bigint PRIMARY KEY DEFAULT nextval('time_slots_id_seq'),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL,
  time time NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT time_slots_business_day_time_key UNIQUE (business_id, day_of_week, time)
);

-- Add RLS policies
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own business time slots"
  ON time_slots FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM businesses
      WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own business time slots"
  ON time_slots FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT id FROM businesses
      WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own business time slots"
  ON time_slots FOR UPDATE
  USING (
    business_id IN (
      SELECT id FROM businesses
      WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own business time slots"
  ON time_slots FOR DELETE
  USING (
    business_id IN (
      SELECT id FROM businesses
      WHERE owner_id = auth.uid()
    )
  ); 