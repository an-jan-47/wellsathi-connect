-- ============================================================
-- Cancel Appointment + Free Slot (Atomic)
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Drop if exists to allow re-running
DROP FUNCTION IF EXISTS public.cancel_appointment(uuid);

CREATE OR REPLACE FUNCTION public.cancel_appointment(
  _appointment_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID;
  _app_clinic_id UUID;
  _app_date DATE;
  _app_time TIME;
  _app_status TEXT;
BEGIN
  _user_id := auth.uid();
  
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Get appointment details and verify ownership
  SELECT clinic_id, date, time, status
  INTO _app_clinic_id, _app_date, _app_time, _app_status
  FROM public.appointments
  WHERE id = _appointment_id AND user_id = _user_id
  FOR UPDATE;

  IF _app_clinic_id IS NULL THEN
    RAISE EXCEPTION 'Appointment not found or not authorized';
  END IF;

  IF _app_status = 'cancelled' THEN
    RAISE EXCEPTION 'Appointment is already cancelled';
  END IF;

  -- Cancel the appointment
  UPDATE public.appointments
  SET status = 'cancelled', updated_at = now()
  WHERE id = _appointment_id;

  -- Free the corresponding time slot
  UPDATE public.time_slots
  SET is_available = true
  WHERE clinic_id = _app_clinic_id
    AND date = _app_date
    AND start_time = _app_time;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cancel_appointment(UUID) TO authenticated;
