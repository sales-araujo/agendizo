-- Create notification_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_new_appointment BOOLEAN DEFAULT true,
  email_appointment_reminder BOOLEAN DEFAULT true,
  email_appointment_cancelled BOOLEAN DEFAULT true,
  sms_new_appointment BOOLEAN DEFAULT false,
  sms_appointment_reminder BOOLEAN DEFAULT false,
  sms_appointment_cancelled BOOLEAN DEFAULT false,
  whatsapp_new_appointment BOOLEAN DEFAULT false,
  whatsapp_appointment_reminder BOOLEAN DEFAULT false,
  whatsapp_appointment_cancelled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id)
);

-- Enable RLS if not already enabled
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own notification settings" ON notification_settings;
DROP POLICY IF EXISTS "Users can update their own notification settings" ON notification_settings;
DROP POLICY IF EXISTS "Users can insert their own notification settings" ON notification_settings;

-- Create RLS policies
CREATE POLICY "Users can view their own notification settings"
  ON notification_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification settings"
  ON notification_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification settings"
  ON notification_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create or replace function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_notification_settings_updated_at ON notification_settings;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_notification_settings_updated_at
  BEFORE UPDATE ON notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 