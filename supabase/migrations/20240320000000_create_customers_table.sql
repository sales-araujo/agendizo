-- Create customers table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view their own business customers
CREATE POLICY "Users can view their own business customers"
    ON public.customers
    FOR SELECT
    USING (
        business_id IN (
            SELECT id FROM public.businesses
            WHERE owner_id = auth.uid()
        )
    );

-- Policy to allow users to insert customers for their own business
CREATE POLICY "Users can insert customers for their own business"
    ON public.customers
    FOR INSERT
    WITH CHECK (
        business_id IN (
            SELECT id FROM public.businesses
            WHERE owner_id = auth.uid()
        )
    );

-- Policy to allow users to update their own business customers
CREATE POLICY "Users can update their own business customers"
    ON public.customers
    FOR UPDATE
    USING (
        business_id IN (
            SELECT id FROM public.businesses
            WHERE owner_id = auth.uid()
        )
    );

-- Policy to allow users to delete their own business customers
CREATE POLICY "Users can delete their own business customers"
    ON public.customers
    FOR DELETE
    USING (
        business_id IN (
            SELECT id FROM public.businesses
            WHERE owner_id = auth.uid()
        )
    );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS customers_business_id_idx ON public.customers(business_id); 