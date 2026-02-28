-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_roles enum
DO $$ BEGIN
    CREATE TYPE app_role AS ENUM ('admin', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Table: profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    property_id TEXT NOT NULL UNIQUE,
    owner_name TEXT NOT NULL,
    address TEXT,
    total_points INTEGER DEFAULT 0 NOT NULL,
    tax_discount_eligibility NUMERIC DEFAULT 0.0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: daily_waste_records
CREATE TABLE IF NOT EXISTS public.daily_waste_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id TEXT NOT NULL REFERENCES public.profiles(property_id) ON DELETE CASCADE,
    date DATE NOT NULL,
    wet_waste_weight NUMERIC DEFAULT 0.0 NOT NULL,
    dry_waste_weight NUMERIC DEFAULT 0.0 NOT NULL,
    segregation_correct BOOLEAN DEFAULT false NOT NULL,
    points_earned INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: rewards_system
CREATE TABLE IF NOT EXISTS public.rewards_system (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    points_required INTEGER NOT NULL,
    tax_discount_percentage NUMERIC NOT NULL,
    label TEXT NOT NULL
);

-- Table: user_roles
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role NOT NULL DEFAULT 'user'::app_role,
    UNIQUE(user_id, role)
);

-- Insert initial reward tiers if empty
INSERT INTO public.rewards_system (points_required, tax_discount_percentage, label)
SELECT 201, 5, 'Bronze Tier'
WHERE NOT EXISTS (SELECT 1 FROM public.rewards_system WHERE points_required = 201);

INSERT INTO public.rewards_system (points_required, tax_discount_percentage, label)
SELECT 501, 10, 'Silver Tier'
WHERE NOT EXISTS (SELECT 1 FROM public.rewards_system WHERE points_required = 501);

INSERT INTO public.rewards_system (points_required, tax_discount_percentage, label)
SELECT 1000, 20, 'Gold Tier'
WHERE NOT EXISTS (SELECT 1 FROM public.rewards_system WHERE points_required = 1000);

-- Function to handle an updated_at column
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for profiles
DROP TRIGGER IF EXISTS handle_profiles_updated_at ON public.profiles;
CREATE TRIGGER handle_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();

-- Function to handle newly created users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, property_id, owner_name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'property_id', 'PROP-' || substr(NEW.id::text, 1, 6)),
        COALESCE(NEW.raw_user_meta_data->>'owner_name', 'User')
    );

    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');

    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_new_user();

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_waste_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards_system ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Profiles
CREATE POLICY "Users can view own profile" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

-- Daily Waste Records
CREATE POLICY "Users can view own waste records" 
    ON public.daily_waste_records FOR SELECT 
    USING (
        property_id IN (
            SELECT property_id FROM public.profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own waste records" 
    ON public.daily_waste_records FOR INSERT 
    WITH CHECK (
        property_id IN (
            SELECT property_id FROM public.profiles WHERE id = auth.uid()
        )
    );

-- Rewards System (Everyone can read)
CREATE POLICY "Everyone can view rewards" 
    ON public.rewards_system FOR SELECT 
    USING (true);

-- User Roles
CREATE POLICY "Users can view own roles" 
    ON public.user_roles FOR SELECT 
    USING (auth.uid() = user_id);

-- Custom RLS Function for Admin Check
CREATE OR REPLACE FUNCTION public.has_role(_role app_role, _user_id uuid DEFAULT auth.uid())
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = _user_id AND role = _role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to easily fetch a user's property ID
CREATE OR REPLACE FUNCTION public.get_my_property_id()
RETURNS text AS $$
DECLARE
  my_prop_id text;
BEGIN
  SELECT property_id INTO my_prop_id FROM public.profiles WHERE id = auth.uid();
  RETURN my_prop_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
