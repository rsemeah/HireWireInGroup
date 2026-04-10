-- Fix Supabase auth signup trigger
-- This trigger automatically creates a user_profile row when a new user signs up

-- First, ensure we have the right function to handle new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profile (id, email, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists (to avoid conflicts)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT ALL ON public.user_profile TO supabase_auth_admin;

-- Ensure RLS allows the trigger to insert
-- The function runs with SECURITY DEFINER, so it bypasses RLS
-- But we need to ensure the policy allows the user to see their own profile

-- Check if policy exists and create if not
DO $$
BEGIN
  -- Drop and recreate the select policy to ensure it's correct
  DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profile;
  CREATE POLICY "Users can view own profile"
    ON public.user_profile
    FOR SELECT
    USING (auth.uid() = id);
    
  DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profile;
  CREATE POLICY "Users can update own profile"
    ON public.user_profile
    FOR UPDATE
    USING (auth.uid() = id);
    
  DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profile;
  CREATE POLICY "Users can insert own profile"
    ON public.user_profile
    FOR INSERT
    WITH CHECK (auth.uid() = id);
END $$;
