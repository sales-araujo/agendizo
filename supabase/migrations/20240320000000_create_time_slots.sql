-- Create time_slots table and sequence
CREATE OR REPLACE FUNCTION create_time_slots_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create sequence if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'time_slots_id_seq') THEN
    CREATE SEQUENCE time_slots_id_seq;
  END IF;

  -- Create table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'time_slots') THEN
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
  END IF;
END;
$$; 