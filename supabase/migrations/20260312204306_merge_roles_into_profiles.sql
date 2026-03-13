-- ============================================================
-- Simplify Schema: Merge user_roles into profiles
-- ============================================================

-- 1. Add `role` column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN role public.app_role NOT NULL DEFAULT 'user';

-- 2. Migrate existing data from user_roles
UPDATE public.profiles p
SET role = ur.role
FROM public.user_roles ur
WHERE p.id = ur.user_id;

-- 3. Replace the has_role function to use the profiles table
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id
      AND role = _role
  )
$$;

-- 4. Update the handle_new_user trigger function
-- (It no longer needs to insert into user_roles)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    NEW.raw_user_meta_data ->> 'phone',
    'user'
  );
  
  RETURN NEW;
END;
$$;

-- 5. Drop the user_roles table completely
-- (This cascades and drops any policies attached to it)
DROP TABLE IF EXISTS public.user_roles;

-- 6. Add Index on profiles.role for fast RBAC lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
