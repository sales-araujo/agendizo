-- Criar tabela de perfis
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    full_name TEXT,
    email TEXT NOT NULL,
    avatar_url TEXT,
    subscription_status TEXT DEFAULT 'inactive',
    subscription_tier TEXT DEFAULT 'free',
    subscription_end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Criar tabela de negócios
CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    logo_url TEXT,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Criar tabela de serviços
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    duration INTEGER NOT NULL,
    price INTEGER NOT NULL,
    business_id UUID REFERENCES public.businesses(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Criar tabela de clientes
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    notes TEXT,
    business_id UUID REFERENCES public.businesses(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Criar tabela de agendamentos
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled',
    notes TEXT,
    client_id UUID REFERENCES public.clients(id) NOT NULL,
    service_id UUID REFERENCES public.services(id) NOT NULL,
    business_id UUID REFERENCES public.businesses(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Criar tabela de disponibilidade
CREATE TABLE IF NOT EXISTS public.availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    day_of_week INTEGER NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    business_id UUID REFERENCES public.businesses(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Criar tabela de assinaturas
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    status TEXT NOT NULL DEFAULT 'inactive',
    tier TEXT NOT NULL DEFAULT 'free',
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Criar políticas de segurança
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Políticas para perfis
CREATE POLICY "Usuários podem ver seus próprios perfis" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seus próprios perfis" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Políticas para negócios
CREATE POLICY "Usuários podem ver seus próprios negócios" ON public.businesses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus próprios negócios" ON public.businesses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios negócios" ON public.businesses
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem excluir seus próprios negócios" ON public.businesses
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para serviços
CREATE POLICY "Usuários podem ver serviços de seus negócios" ON public.services
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.businesses
            WHERE businesses.id = services.business_id
            AND businesses.user_id = auth.uid()
        )
    );

CREATE POLICY "Usuários podem criar serviços para seus negócios" ON public.services
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.businesses
            WHERE businesses.id = services.business_id
            AND businesses.user_id = auth.uid()
        )
    );

CREATE POLICY "Usuários podem atualizar serviços de seus negócios" ON public.services
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.businesses
            WHERE businesses.id = services.business_id
            AND businesses.user_id = auth.uid()
        )
    );

CREATE POLICY "Usuários podem excluir serviços de seus negócios" ON public.services
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.businesses
            WHERE businesses.id = services.business_id
            AND businesses.user_id = auth.uid()
        )
    );

-- Políticas para clientes
CREATE POLICY "Usuários podem ver clientes de seus negócios" ON public.clients
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.businesses
            WHERE businesses.id = clients.business_id
            AND businesses.user_id = auth.uid()
        )
    );

CREATE POLICY "Usuários podem criar clientes para seus negócios" ON public.clients
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.businesses
            WHERE businesses.id = clients.business_id
            AND businesses.user_id = auth.uid()
        )
    );

CREATE POLICY "Usuários podem atualizar clientes de seus negócios" ON public.clients
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.businesses
            WHERE businesses.id = clients.business_id
            AND businesses.user_id = auth.uid()
        )
    );

CREATE POLICY "Usuários podem excluir clientes de seus negócios" ON public.clients
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.businesses
            WHERE businesses.id = clients.business_id
            AND businesses.user_id = auth.uid()
        )
    );

-- Políticas para agendamentos
CREATE POLICY "Usuários podem ver agendamentos de seus negócios" ON public.appointments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.businesses
            WHERE businesses.id = appointments.business_id
            AND businesses.user_id = auth.uid()
        )
    );

CREATE POLICY "Usuários podem criar agendamentos para seus negócios" ON public.appointments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.businesses
            WHERE businesses.id = appointments.business_id
            AND businesses.user_id = auth.uid()
        )
    );

CREATE POLICY "Usuários podem atualizar agendamentos de seus negócios" ON public.appointments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.businesses
            WHERE businesses.id = appointments.business_id
            AND businesses.user_id = auth.uid()
        )
    );

CREATE POLICY "Usuários podem excluir agendamentos de seus negócios" ON public.appointments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.businesses
            WHERE businesses.id = appointments.business_id
            AND businesses.user_id = auth.uid()
        )
    );

-- Políticas para disponibilidade
CREATE POLICY "Usuários podem ver disponibilidade de seus negócios" ON public.availability
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.businesses
            WHERE businesses.id = availability.business_id
            AND businesses.user_id = auth.uid()
        )
    );

CREATE POLICY "Usuários podem criar disponibilidade para seus negócios" ON public.availability
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.businesses
            WHERE businesses.id = availability.business_id
            AND businesses.user_id = auth.uid()
        )
    );

CREATE POLICY "Usuários podem atualizar disponibilidade de seus negócios" ON public.availability
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.businesses
            WHERE businesses.id = availability.business_id
            AND businesses.user_id = auth.uid()
        )
    );

CREATE POLICY "Usuários podem excluir disponibilidade de seus negócios" ON public.availability
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.businesses
            WHERE businesses.id = availability.business_id
            AND businesses.user_id = auth.uid()
        )
    );

-- Políticas para assinaturas
CREATE POLICY "Usuários podem ver suas próprias assinaturas" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias assinaturas" ON public.subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- Criar funções para atualizar timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar triggers para atualizar timestamps
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_businesses_updated_at
BEFORE UPDATE ON public.businesses
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at
BEFORE UPDATE ON public.services
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
BEFORE UPDATE ON public.clients
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_availability_updated_at
BEFORE UPDATE ON public.availability
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
