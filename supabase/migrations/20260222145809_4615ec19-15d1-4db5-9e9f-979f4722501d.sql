
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id TEXT UNIQUE NOT NULL,
  owner_name TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  total_points INTEGER NOT NULL DEFAULT 0,
  tax_discount_eligibility NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create daily_waste_records table
CREATE TABLE public.daily_waste_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id TEXT NOT NULL REFERENCES public.profiles(property_id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  wet_waste_weight NUMERIC NOT NULL DEFAULT 0,
  dry_waste_weight NUMERIC NOT NULL DEFAULT 0,
  segregation_correct BOOLEAN NOT NULL DEFAULT false,
  points_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create rewards_system table
CREATE TABLE public.rewards_system (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  points_required INTEGER NOT NULL,
  tax_discount_percentage NUMERIC NOT NULL,
  label TEXT NOT NULL DEFAULT ''
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE(user_id, role)
);

-- Insert default reward tiers
INSERT INTO public.rewards_system (points_required, tax_discount_percentage, label) VALUES
  (500, 2, 'Bronze'),
  (1000, 5, 'Silver'),
  (2000, 8, 'Gold'),
  (5000, 15, 'Platinum');

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to get property_id for current user
CREATE OR REPLACE FUNCTION public.get_my_property_id()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT property_id FROM public.profiles WHERE id = auth.uid()
$$;

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_waste_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards_system ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Allow insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can manage all profiles" ON public.profiles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Daily waste records policies
CREATE POLICY "Users view own records" ON public.daily_waste_records
  FOR SELECT USING (
    property_id = public.get_my_property_id() OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Insert records via API" ON public.daily_waste_records
  FOR INSERT WITH CHECK (true);

-- Rewards system policies (everyone can read)
CREATE POLICY "Anyone can read rewards" ON public.rewards_system
  FOR SELECT USING (true);

CREATE POLICY "Admins manage rewards" ON public.rewards_system
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- User roles policies
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own role" ON public.user_roles
  FOR SELECT USING (user_id = auth.uid());

-- Trigger function for points calculation and total update
CREATE OR REPLACE FUNCTION public.calculate_and_update_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  calculated_points INTEGER := 0;
  has_both BOOLEAN := false;
BEGIN
  -- Calculate points
  IF NEW.segregation_correct THEN
    calculated_points := FLOOR((NEW.wet_waste_weight + NEW.dry_waste_weight) * 10);
    
    -- Check if both wet and dry present on same day for bonus
    IF NEW.wet_waste_weight > 0 AND NEW.dry_waste_weight > 0 THEN
      calculated_points := calculated_points + 20;
    END IF;
  END IF;
  
  NEW.points_earned := calculated_points;
  
  -- Update total points in profiles
  UPDATE public.profiles
  SET total_points = total_points + calculated_points,
      updated_at = now()
  WHERE property_id = NEW.property_id;
  
  -- Update tax discount eligibility
  UPDATE public.profiles
  SET tax_discount_eligibility = COALESCE(
    (SELECT MAX(tax_discount_percentage) FROM public.rewards_system
     WHERE points_required <= (SELECT total_points + calculated_points FROM public.profiles WHERE property_id = NEW.property_id)),
    0
  )
  WHERE property_id = NEW.property_id;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_calculate_points
  BEFORE INSERT ON public.daily_waste_records
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_and_update_points();

-- Auto-create profile trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, property_id, owner_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'property_id', 'PROP-' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'owner_name', '')
  );
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
