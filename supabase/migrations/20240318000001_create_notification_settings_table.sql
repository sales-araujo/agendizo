-- Create notification_settings table
CREATE TABLE IF NOT EXISTS public.notification_settings (
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for own settings" ON public.notification_settings
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Enable update access for own settings" ON public.notification_settings
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Enable insert access for own settings" ON public.notification_settings
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER handle_notification_settings_updated_at
    BEFORE UPDATE ON public.notification_settings
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at(); 