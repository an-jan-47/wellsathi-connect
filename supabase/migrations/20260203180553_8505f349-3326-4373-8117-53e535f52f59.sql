-- Create storage buckets for clinic images and certificates
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('clinic-images', 'clinic-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('clinic-certificates', 'clinic-certificates', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);

-- Storage policies for clinic-images bucket (public read, authenticated upload)
CREATE POLICY "Anyone can view clinic images"
ON storage.objects FOR SELECT
USING (bucket_id = 'clinic-images');

CREATE POLICY "Authenticated users can upload clinic images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'clinic-images');

CREATE POLICY "Users can update their own clinic images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'clinic-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own clinic images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'clinic-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for clinic-certificates bucket (private, only owner access)
CREATE POLICY "Clinic owners can view their certificates"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'clinic-certificates' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Authenticated users can upload certificates"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'clinic-certificates');

CREATE POLICY "Users can update their own certificates"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'clinic-certificates' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own certificates"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'clinic-certificates' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Admins can access all certificates
CREATE POLICY "Admins can view all certificates"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'clinic-certificates' AND public.has_role(auth.uid(), 'admin'));

-- Add new columns to clinics table
ALTER TABLE public.clinics 
ADD COLUMN IF NOT EXISTS registration_number text,
ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS certificates text[] DEFAULT '{}';

-- Create clinic_doctors table for storing multiple doctors per clinic with their services
CREATE TABLE IF NOT EXISTS public.clinic_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
  service_name text NOT NULL,
  fee integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on clinic_services
ALTER TABLE public.clinic_services ENABLE ROW LEVEL SECURITY;

-- RLS policies for clinic_services
CREATE POLICY "Anyone can view services of approved clinics"
ON public.clinic_services FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.clinics 
  WHERE clinics.id = clinic_services.clinic_id 
  AND clinics.is_approved = true
));

CREATE POLICY "Clinic owners can manage their services"
ON public.clinic_services FOR ALL
TO authenticated
USING (public.owns_clinic(auth.uid(), clinic_id));

CREATE POLICY "Admins can manage all services"
ON public.clinic_services FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add fee column to doctors table if not exists
ALTER TABLE public.doctors 
ADD COLUMN IF NOT EXISTS fee integer DEFAULT 0;

-- Update doctors RLS to allow clinic owners to view their own doctors during registration
CREATE POLICY "Clinic owners can view their doctors"
ON public.doctors FOR SELECT
TO authenticated
USING (public.owns_clinic(auth.uid(), clinic_id));