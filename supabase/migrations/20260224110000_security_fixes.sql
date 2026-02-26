-- ============================================================
-- PHASE 1: Security & Stability Migration
-- ============================================================

-- 1. FIX CRITICAL: Open appointment INSERT policy
--    Previously: WITH CHECK (true) allowed ANY anonymous user to insert
DROP POLICY IF EXISTS "Anyone can create appointments" ON public.appointments;

CREATE POLICY "Authenticated users can create appointments"
  ON public.appointments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 2. FIX CRITICAL: assign_clinic_role privilege escalation
--    Previously: Any user could assign clinic role to ANY user_id
--    Now: Only allows assigning the role to the calling user themselves
CREATE OR REPLACE FUNCTION public.assign_clinic_role(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Prevent privilege escalation: only allow self-assignment
  IF _user_id != auth.uid() THEN
    RAISE EXCEPTION 'Cannot assign roles to other users';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'clinic')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- 3. ATOMIC BOOKING: Prevent double-booking race condition
--    This function atomically creates an appointment AND marks the slot unavailable
--    in a single transaction, preventing two users from booking the same slot.
CREATE OR REPLACE FUNCTION public.book_appointment(
  _clinic_id UUID,
  _slot_id UUID,
  _patient_name TEXT,
  _patient_phone TEXT,
  _date DATE,
  _time TIME,
  _notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _appointment_id UUID;
  _user_id UUID;
  _slot_available BOOLEAN;
BEGIN
  _user_id := auth.uid();
  
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Lock the slot row to prevent concurrent bookings
  SELECT is_available INTO _slot_available
  FROM public.time_slots
  WHERE id = _slot_id
  FOR UPDATE;

  IF _slot_available IS NULL THEN
    RAISE EXCEPTION 'Time slot not found';
  END IF;

  IF NOT _slot_available THEN
    RAISE EXCEPTION 'This time slot is no longer available';
  END IF;

  -- Mark slot as unavailable
  UPDATE public.time_slots
  SET is_available = false
  WHERE id = _slot_id;

  -- Create the appointment
  INSERT INTO public.appointments (
    clinic_id, user_id, patient_name, patient_phone,
    date, time, notes, status
  ) VALUES (
    _clinic_id, _user_id, _patient_name, _patient_phone,
    _date, _time, _notes, 'pending'
  )
  RETURNING id INTO _appointment_id;

  RETURN _appointment_id;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.book_appointment(UUID, UUID, TEXT, TEXT, DATE, TIME, TEXT) TO authenticated;
