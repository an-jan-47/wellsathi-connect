
-- Create reviews table
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(appointment_id)
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can view reviews of approved clinics
CREATE POLICY "Anyone can view reviews of approved clinics"
ON public.reviews
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM clinics WHERE clinics.id = reviews.clinic_id AND clinics.is_approved = true
));

-- Clinic owners can view their reviews
CREATE POLICY "Clinic owners can view their reviews"
ON public.reviews
FOR SELECT
USING (owns_clinic(auth.uid(), clinic_id));

-- Authenticated users can create reviews
CREATE POLICY "Users can create own reviews"
ON public.reviews
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own reviews
CREATE POLICY "Users can update own reviews"
ON public.reviews
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete own reviews"
ON public.reviews
FOR DELETE
USING (auth.uid() = user_id);

-- Admins can manage all reviews
CREATE POLICY "Admins can manage all reviews"
ON public.reviews
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create function to update clinic average rating
CREATE OR REPLACE FUNCTION public.update_clinic_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _clinic_id UUID;
  _avg_rating NUMERIC;
BEGIN
  _clinic_id := COALESCE(NEW.clinic_id, OLD.clinic_id);
  
  SELECT COALESCE(AVG(rating)::NUMERIC(3,2), 0)
  INTO _avg_rating
  FROM public.reviews
  WHERE clinic_id = _clinic_id;
  
  UPDATE public.clinics
  SET rating = _avg_rating
  WHERE id = _clinic_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger to auto-update rating on review changes
CREATE TRIGGER update_clinic_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_clinic_rating();

-- Update timestamp trigger for reviews
CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
