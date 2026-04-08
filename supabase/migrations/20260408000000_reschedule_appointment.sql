-- =====================================================
-- WellSathi — Reschedule Appointment RPC
-- Atomically cancels the old appointment and creates
-- a new one at the specified date/time/doctor.
-- =====================================================

CREATE OR REPLACE FUNCTION reschedule_appointment(
  _appointment_id UUID,
  _new_doctor_id UUID,
  _new_date DATE,
  _new_time TIME
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID;
  _old RECORD;
  _new_appointment_id UUID;
  _is_clinic_owner BOOLEAN;
BEGIN
  _user_id := auth.uid();

  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Fetch old appointment with FOR UPDATE lock to prevent races
  SELECT a.*, c.owner_id
    INTO _old
    FROM appointments a
    JOIN clinics c ON c.id = a.clinic_id
   WHERE a.id = _appointment_id
   FOR UPDATE OF a;

  IF _old.id IS NULL THEN
    RAISE EXCEPTION 'Appointment not found';
  END IF;

  -- Authorization: caller must be either the patient or the clinic owner
  _is_clinic_owner := (_user_id = _old.owner_id);
  IF _user_id != _old.user_id AND NOT _is_clinic_owner THEN
    RAISE EXCEPTION 'Not authorized to reschedule this appointment';
  END IF;

  -- Only pending or confirmed appointments can be rescheduled
  IF _old.status NOT IN ('pending', 'confirmed') THEN
    RAISE EXCEPTION 'Cannot reschedule a % appointment', _old.status;
  END IF;

  -- Cancel the old appointment (frees the old slot since get_doctor_slots
  -- checks status != 'cancelled')
  UPDATE appointments
     SET status = 'cancelled', updated_at = NOW()
   WHERE id = _appointment_id;

  -- Create the new appointment preserving all patient details
  INSERT INTO appointments (
    clinic_id, doctor_id, user_id, patient_name, patient_phone,
    date, time, notes, status, total_fee
  ) VALUES (
    _old.clinic_id, _new_doctor_id, _old.user_id, _old.patient_name,
    _old.patient_phone, _new_date, _new_time, _old.notes,
    'pending', _old.total_fee
  )
  RETURNING id INTO _new_appointment_id;

  -- Copy over any booked services
  INSERT INTO booking_services (appointment_id, service_id, fee)
  SELECT _new_appointment_id, bs.service_id, bs.fee
    FROM booking_services bs
   WHERE bs.appointment_id = _appointment_id;

  RETURN _new_appointment_id;
EXCEPTION
  WHEN unique_violation THEN
    -- Re-mark old appointment back to its original status on collision
    UPDATE appointments
       SET status = _old.status::appointment_status, updated_at = NOW()
     WHERE id = _appointment_id;
    RAISE EXCEPTION 'The selected time slot is no longer available';
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION reschedule_appointment(UUID, UUID, DATE, TIME) TO authenticated;
