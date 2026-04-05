-- ============================================================
-- SECURITY HARDENING MIGRATION
-- Date: 2026-03-28
-- Fixes: Ownership checks on RPCs, RLS on unprotected tables
-- ============================================================


-- ============================================================
-- 1. FIX CRITICAL: cancel_appointment — Add ownership validation
--    Previously: Any authenticated user could cancel ANY appointment
--    Now: Only the patient (user_id) or clinic owner can cancel
-- ============================================================
CREATE OR REPLACE FUNCTION cancel_appointment(_appointment_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _caller UUID;
  _app_record RECORD;
BEGIN
  _caller := auth.uid();
  
  IF _caller IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Fetch appointment and lock the row
  SELECT a.id, a.clinic_id, a.user_id, a.status
  INTO _app_record
  FROM appointments a
  WHERE a.id = _appointment_id
  FOR UPDATE;

  IF _app_record.id IS NULL THEN
    RAISE EXCEPTION 'Appointment not found';
  END IF;

  -- Verify caller is the patient OR the clinic owner
  IF _app_record.user_id != _caller
    AND NOT owns_clinic(_caller, _app_record.clinic_id)
  THEN
    RAISE EXCEPTION 'Forbidden: You are not authorized to cancel this appointment';
  END IF;

  IF _app_record.status = 'cancelled' THEN
    RAISE EXCEPTION 'Appointment is already cancelled';
  END IF;

  -- Cancel the appointment
  UPDATE appointments
     SET status = 'cancelled', updated_at = NOW()
   WHERE id = _appointment_id;
END;
$$;

-- Ensure only authenticated users can call
GRANT EXECUTE ON FUNCTION cancel_appointment(UUID) TO authenticated;
REVOKE EXECUTE ON FUNCTION cancel_appointment(UUID) FROM anon;


-- ============================================================
-- 2. FIX CRITICAL: update_appointment_status — Add ownership validation
--    Previously: Any authenticated user could confirm/cancel ANY appointment
--    Now: Only the clinic owner can confirm or cancel appointments
-- ============================================================
CREATE OR REPLACE FUNCTION update_appointment_status(
  _appointment_id UUID,
  _new_status TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _caller UUID;
  _app_record RECORD;
BEGIN
  _caller := auth.uid();
  
  IF _caller IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Validate status
  IF _new_status NOT IN ('confirmed', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid status: %. Must be confirmed or cancelled', _new_status;
  END IF;

  -- Fetch appointment
  SELECT a.id, a.clinic_id, a.status
  INTO _app_record
  FROM appointments a
  WHERE a.id = _appointment_id;

  IF _app_record.id IS NULL THEN
    RAISE EXCEPTION 'Appointment not found';
  END IF;

  -- Only the clinic owner can confirm/cancel via this function
  IF NOT owns_clinic(_caller, _app_record.clinic_id) THEN
    RAISE EXCEPTION 'Forbidden: Only the clinic owner can update appointment status';
  END IF;

  -- Prevent redundant updates
  IF _app_record.status::TEXT = _new_status THEN
    RAISE EXCEPTION 'Appointment is already %', _new_status;
  END IF;

  -- Update status
  UPDATE appointments
     SET status = _new_status::appointment_status, updated_at = NOW()
   WHERE id = _appointment_id;
END;
$$;

-- Ensure only authenticated users can call
GRANT EXECUTE ON FUNCTION update_appointment_status(UUID, TEXT) TO authenticated;
REVOKE EXECUTE ON FUNCTION update_appointment_status(UUID, TEXT) FROM anon;


-- ============================================================
-- 3. RLS: booking_services table
--    This table was used without a migration — create it if missing,
--    then add proper RLS policies
-- ============================================================
CREATE TABLE IF NOT EXISTS booking_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES clinic_services(id) ON DELETE CASCADE,
  fee NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE booking_services ENABLE ROW LEVEL SECURITY;

-- Patients can view their own booking services (via appointment ownership)
DO $$
BEGIN
  CREATE POLICY "Users can view own booking services"
    ON booking_services FOR SELECT
    USING (EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.id = booking_services.appointment_id
        AND a.user_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Clinic owners can view booking services for their appointments
DO $$
BEGIN
  CREATE POLICY "Clinic owners can view booking services"
    ON booking_services FOR SELECT
    USING (EXISTS (
      SELECT 1 FROM appointments a
      JOIN clinics c ON a.clinic_id = c.id
      WHERE a.id = booking_services.appointment_id
        AND c.owner_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Only the booking RPC or service-role should insert booking services
-- We allow authenticated insert if the user owns the appointment
DO $$
BEGIN
  CREATE POLICY "Users can insert booking services for own appointments"
    ON booking_services FOR INSERT TO authenticated
    WITH CHECK (EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.id = booking_services.appointment_id
        AND a.user_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Admins can manage all booking services
DO $$
BEGIN
  CREATE POLICY "Admins can manage all booking services"
    ON booking_services FOR ALL
    USING (has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ============================================================
-- 4. RLS: clinic_patients table
--    This table stores patient records — highly sensitive
-- ============================================================
CREATE TABLE IF NOT EXISTS clinic_patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  condition TEXT,
  status TEXT DEFAULT 'active',
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE clinic_patients ENABLE ROW LEVEL SECURITY;

-- Only clinic owners can view their own patients
DO $$
BEGIN
  CREATE POLICY "Clinic owners can view their patients"
    ON clinic_patients FOR SELECT TO authenticated
    USING (owns_clinic(auth.uid(), clinic_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Only clinic owners can insert patients for their clinic
DO $$
BEGIN
  CREATE POLICY "Clinic owners can insert patients"
    ON clinic_patients FOR INSERT TO authenticated
    WITH CHECK (owns_clinic(auth.uid(), clinic_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Only clinic owners can update their patients
DO $$
BEGIN
  CREATE POLICY "Clinic owners can update their patients"
    ON clinic_patients FOR UPDATE TO authenticated
    USING (owns_clinic(auth.uid(), clinic_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Only clinic owners can delete (soft-delete) their patients
DO $$
BEGIN
  CREATE POLICY "Clinic owners can delete their patients"
    ON clinic_patients FOR DELETE TO authenticated
    USING (owns_clinic(auth.uid(), clinic_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Admins can manage all patients
DO $$
BEGIN
  CREATE POLICY "Admins can manage all clinic patients"
    ON clinic_patients FOR ALL
    USING (has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ============================================================
-- 5. Performance: Add missing composite index for get_doctor_slots
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date 
  ON appointments(doctor_id, date);

-- Index for booking_services lookups
CREATE INDEX IF NOT EXISTS idx_booking_services_appointment_id
  ON booking_services(appointment_id);

-- Index for clinic_patients lookups
CREATE INDEX IF NOT EXISTS idx_clinic_patients_clinic_id
  ON clinic_patients(clinic_id);


-- ============================================================
-- 6. Tighten appointment RLS: Prevent patients from self-confirming
--    The existing "Users can update own appointments" policy allows
--    patients to set status=confirmed. Restrict to only allow cancellation.
-- ============================================================
DROP POLICY IF EXISTS "Users can update own appointments" ON appointments;

CREATE POLICY "Users can cancel own appointments"
  ON appointments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (status = 'cancelled');
