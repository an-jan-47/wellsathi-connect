-- ============================================================
-- Phase 2: Secure RBAC Database Migration
-- ============================================================

-- 1. Remove insecure privilege escalation vector
--    The assign_clinic_role function was accessible to any authenticated user,
--    allowing any user to become a clinic owner without going through proper registration.
DROP FUNCTION IF EXISTS public.assign_clinic_role(_user_id UUID);

-- Note: The user_roles table already correctly relies on RLS to deny inserts 
-- by default to regular users (no INSERT policy defined for regular users).
-- Role assignment will now be exclusively handled by the 'register-clinic'
-- Edge Function using the Supabase Service Role key, bypassing RLS securely.
