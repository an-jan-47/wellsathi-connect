-- Migration: Add gender, age, and address fields to profiles table
-- Description: Adds demographic and location fields with validation constraints
-- Idempotent: Safe to run multiple times

-- Add gender column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'gender'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN gender TEXT;
  END IF;
END $$;

-- Add gender CHECK constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_gender_check'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_gender_check
    CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say'));
  END IF;
END $$;

-- Add age column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'age'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN age SMALLINT;
  END IF;
END $$;

-- Add age CHECK constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_age_check'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_age_check
    CHECK (age >= 0 AND age <= 150);
  END IF;
END $$;

-- Add address column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'address'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN address JSONB;
  END IF;
END $$;

-- Create GIN index on address for efficient querying
CREATE INDEX IF NOT EXISTS profiles_address_gin
  ON public.profiles
  USING gin (address jsonb_path_ops);

-- Verify migration
DO $$
BEGIN
  -- Check columns exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name IN ('gender', 'age', 'address')
    HAVING COUNT(*) = 3
  ) THEN
    RAISE EXCEPTION 'Migration verification failed: columns not created';
  END IF;

  -- Check constraints exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
      AND conname IN ('profiles_gender_check', 'profiles_age_check')
    HAVING COUNT(*) = 2
  ) THEN
    RAISE EXCEPTION 'Migration verification failed: constraints not created';
  END IF;

  -- Check index exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND indexname = 'profiles_address_gin'
  ) THEN
    RAISE EXCEPTION 'Migration verification failed: index not created';
  END IF;

  RAISE NOTICE 'Migration completed successfully';
END $$;