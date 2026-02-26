-- ============================================================
-- SEED DATA: Clinics, Doctors, Services, and Time Slots
-- Run this in your Supabase SQL Editor to populate the database
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- 1. INSERT DEMO CLINICS (approved, with ratings)
-- ──────────────────────────────────────────────────────────────

INSERT INTO clinics (id, name, address, city, fees, phone, description, specializations, is_approved, rating, registration_number)
VALUES
  ('a1b2c3d4-1111-4000-8000-000000000001',
   'City Health Clinic',
   '45 MG Road, Near Central Mall',
   'Mumbai',
   500,
   '9876543210',
   'A multi-specialty clinic offering comprehensive healthcare services with experienced doctors and modern facilities. We specialize in general medicine, pediatrics, and cardiology.',
   ARRAY['General Medicine', 'Pediatrics', 'Cardiology'],
   true,
   4.5,
   'MH-2024-00123'),

  ('a1b2c3d4-2222-4000-8000-000000000002',
   'Green Valley Hospital',
   '12 Park Avenue, Sector 5',
   'Delhi',
   800,
   '9876543211',
   'Premium healthcare facility with state-of-the-art diagnostic equipment. Our team of specialists provides world-class treatment in dermatology, orthopedics, and neurology.',
   ARRAY['Dermatology', 'Orthopedics', 'Neurology'],
   true,
   4.8,
   'DL-2024-00456'),

  ('a1b2c3d4-3333-4000-8000-000000000003',
   'Sunrise Family Clinic',
   '78 Station Road, Old Town',
   'Pune',
   350,
   '9876543212',
   'Your trusted neighborhood family clinic. We provide affordable healthcare with a personal touch. Walk-ins welcome!',
   ARRAY['General Medicine', 'ENT', 'Ophthalmology'],
   true,
   4.2,
   'MH-2024-00789'),

  ('a1b2c3d4-4444-4000-8000-000000000004',
   'Dr. Sharma''s Dental Care',
   '23 Civil Lines, Main Market',
   'Jaipur',
   600,
   '9876543213',
   'Complete dental care under one roof. From routine checkups to advanced cosmetic dentistry, we have you covered.',
   ARRAY['Dentistry'],
   true,
   4.6,
   'RJ-2024-00321'),

  ('a1b2c3d4-5555-4000-8000-000000000005',
   'Wellness Hub',
   '9 Lake View Colony',
   'Bangalore',
   700,
   '9876543214',
   'Integrative healthcare combining modern medicine with traditional wellness practices. Specializing in physiotherapy, ayurveda, and mental health.',
   ARRAY['Physiotherapy', 'Ayurveda', 'Psychiatry'],
   true,
   4.3,
   'KA-2024-00654'),

  -- One unapproved clinic (for admin testing)
  ('a1b2c3d4-6666-4000-8000-000000000006',
   'New Care Hospital',
   '56 Industrial Area, Phase 2',
   'Hyderabad',
   450,
   '9876543215',
   'Newly established hospital seeking approval. Specializes in general surgery and urology.',
   ARRAY['General Surgery', 'Urology'],
   false,
   null,
   'TS-2024-00999')

ON CONFLICT (id) DO NOTHING;


-- ──────────────────────────────────────────────────────────────
-- 2. INSERT DOCTORS
-- ──────────────────────────────────────────────────────────────

INSERT INTO doctors (id, clinic_id, name, specialization, bio)
VALUES
  -- City Health Clinic
  (gen_random_uuid(), 'a1b2c3d4-1111-4000-8000-000000000001', 'Dr. Priya Mehta', 'General Medicine', 'MBBS, MD with 15 years of experience in internal medicine'),
  (gen_random_uuid(), 'a1b2c3d4-1111-4000-8000-000000000001', 'Dr. Rajesh Kumar', 'Cardiology', 'DM Cardiology, 10+ years experience in interventional cardiology'),
  (gen_random_uuid(), 'a1b2c3d4-1111-4000-8000-000000000001', 'Dr. Sneha Patel', 'Pediatrics', 'MD Pediatrics, specializes in newborn and child healthcare'),

  -- Green Valley Hospital
  (gen_random_uuid(), 'a1b2c3d4-2222-4000-8000-000000000002', 'Dr. Arun Singh', 'Dermatology', 'MD Dermatology, expert in skin allergies and cosmetic dermatology'),
  (gen_random_uuid(), 'a1b2c3d4-2222-4000-8000-000000000002', 'Dr. Kavita Sharma', 'Orthopedics', 'MS Orthopedics, fellowship in sports medicine'),
  (gen_random_uuid(), 'a1b2c3d4-2222-4000-8000-000000000002', 'Dr. Vikram Rao', 'Neurology', 'DM Neurology, specializes in headache and epilepsy management'),

  -- Sunrise Family Clinic
  (gen_random_uuid(), 'a1b2c3d4-3333-4000-8000-000000000003', 'Dr. Anita Desai', 'General Medicine', 'MBBS with 20 years of family practice experience'),
  (gen_random_uuid(), 'a1b2c3d4-3333-4000-8000-000000000003', 'Dr. Mohan Gupta', 'ENT', 'MS ENT, expert in sinus conditions and hearing disorders'),

  -- Dr. Sharma's Dental Care
  (gen_random_uuid(), 'a1b2c3d4-4444-4000-8000-000000000004', 'Dr. Rahul Sharma', 'Dentistry', 'BDS, MDS - Prosthodontics, 12 years experience'),
  (gen_random_uuid(), 'a1b2c3d4-4444-4000-8000-000000000004', 'Dr. Meera Jain', 'Dentistry', 'BDS, MDS - Orthodontics, specializes in braces and aligners'),

  -- Wellness Hub
  (gen_random_uuid(), 'a1b2c3d4-5555-4000-8000-000000000005', 'Dr. Deepak Verma', 'Physiotherapy', 'MPT, MIAP - specializes in sports injury rehabilitation'),
  (gen_random_uuid(), 'a1b2c3d4-5555-4000-8000-000000000005', 'Dr. Lakshmi Nair', 'Ayurveda', 'BAMS, MD Ayurveda - Panchakarma specialist');


-- ──────────────────────────────────────────────────────────────
-- 3. INSERT CLINIC SERVICES
-- ──────────────────────────────────────────────────────────────

INSERT INTO clinic_services (id, clinic_id, service_name, fee)
VALUES
  -- City Health Clinic
  (gen_random_uuid(), 'a1b2c3d4-1111-4000-8000-000000000001', 'General Consultation', 500),
  (gen_random_uuid(), 'a1b2c3d4-1111-4000-8000-000000000001', 'Health Checkup', 1500),
  (gen_random_uuid(), 'a1b2c3d4-1111-4000-8000-000000000001', 'ECG', 800),
  (gen_random_uuid(), 'a1b2c3d4-1111-4000-8000-000000000001', 'Blood Test', 600),

  -- Green Valley Hospital
  (gen_random_uuid(), 'a1b2c3d4-2222-4000-8000-000000000002', 'General Consultation', 800),
  (gen_random_uuid(), 'a1b2c3d4-2222-4000-8000-000000000002', 'X-Ray', 1200),
  (gen_random_uuid(), 'a1b2c3d4-2222-4000-8000-000000000002', 'Ultrasound', 2000),
  (gen_random_uuid(), 'a1b2c3d4-2222-4000-8000-000000000002', 'Physiotherapy Session', 1000),

  -- Sunrise Family Clinic
  (gen_random_uuid(), 'a1b2c3d4-3333-4000-8000-000000000003', 'General Consultation', 350),
  (gen_random_uuid(), 'a1b2c3d4-3333-4000-8000-000000000003', 'Follow-up Visit', 200),
  (gen_random_uuid(), 'a1b2c3d4-3333-4000-8000-000000000003', 'Eye Examination', 500),
  (gen_random_uuid(), 'a1b2c3d4-3333-4000-8000-000000000003', 'Vaccination', 300),

  -- Dr. Sharma's Dental Care
  (gen_random_uuid(), 'a1b2c3d4-4444-4000-8000-000000000004', 'Dental Cleaning', 600),
  (gen_random_uuid(), 'a1b2c3d4-4444-4000-8000-000000000004', 'Root Canal', 5000),
  (gen_random_uuid(), 'a1b2c3d4-4444-4000-8000-000000000004', 'Dental Filling', 1500),
  (gen_random_uuid(), 'a1b2c3d4-4444-4000-8000-000000000004', 'Teeth Whitening', 3000),

  -- Wellness Hub
  (gen_random_uuid(), 'a1b2c3d4-5555-4000-8000-000000000005', 'Physiotherapy Session', 700),
  (gen_random_uuid(), 'a1b2c3d4-5555-4000-8000-000000000005', 'Ayurvedic Consultation', 600),
  (gen_random_uuid(), 'a1b2c3d4-5555-4000-8000-000000000005', 'Panchakarma Package', 5000),
  (gen_random_uuid(), 'a1b2c3d4-5555-4000-8000-000000000005', 'Yoga Therapy', 400);


-- ──────────────────────────────────────────────────────────────
-- 4. INSERT TIME SLOTS (Next 7 days, for ALL clinics)
--    This generates slots every 30 min from 09:00 to 17:00
--    for each clinic for the next 7 days.
-- ──────────────────────────────────────────────────────────────

-- Generate time slots for the 5 demo clinics
INSERT INTO time_slots (id, clinic_id, date, start_time, end_time, is_available)
SELECT
  gen_random_uuid(),
  c.id,
  (CURRENT_DATE + d.day_offset)::date,
  s.slot_start,
  (s.slot_start + INTERVAL '30 minutes')::time,
  true
FROM
  (
    SELECT id FROM clinics
    WHERE id IN (
      'a1b2c3d4-1111-4000-8000-000000000001',
      'a1b2c3d4-2222-4000-8000-000000000002',
      'a1b2c3d4-3333-4000-8000-000000000003',
      'a1b2c3d4-4444-4000-8000-000000000004',
      'a1b2c3d4-5555-4000-8000-000000000005'
    )
  ) c
  CROSS JOIN generate_series(0, 6) AS d(day_offset)
  CROSS JOIN (VALUES
    ('09:00'::time), ('09:30'::time), ('10:00'::time), ('10:30'::time),
    ('11:00'::time), ('11:30'::time), ('12:00'::time), ('12:30'::time),
    ('14:00'::time), ('14:30'::time), ('15:00'::time), ('15:30'::time),
    ('16:00'::time), ('16:30'::time)
  ) AS s(slot_start);

-- Also generate time slots for ALL OTHER EXISTING clinics
-- (this will add slots for "shrikant medos" and any other real clinics)
INSERT INTO time_slots (id, clinic_id, date, start_time, end_time, is_available)
SELECT
  gen_random_uuid(),
  c.id,
  (CURRENT_DATE + d.day_offset)::date,
  s.slot_start,
  (s.slot_start + INTERVAL '30 minutes')::time,
  true
FROM
  clinics c
  CROSS JOIN generate_series(0, 6) AS d(day_offset)
  CROSS JOIN (VALUES
    ('09:00'::time), ('09:30'::time), ('10:00'::time), ('10:30'::time),
    ('11:00'::time), ('11:30'::time), ('12:00'::time), ('12:30'::time),
    ('14:00'::time), ('14:30'::time), ('15:00'::time), ('15:30'::time),
    ('16:00'::time), ('16:30'::time)
  ) AS s(slot_start)
WHERE c.id NOT IN (
  'a1b2c3d4-1111-4000-8000-000000000001',
  'a1b2c3d4-2222-4000-8000-000000000002',
  'a1b2c3d4-3333-4000-8000-000000000003',
  'a1b2c3d4-4444-4000-8000-000000000004',
  'a1b2c3d4-5555-4000-8000-000000000005'
)
AND NOT EXISTS (
  SELECT 1 FROM time_slots ts
  WHERE ts.clinic_id = c.id
    AND ts.date = (CURRENT_DATE + d.day_offset)::date
    AND ts.start_time = s.slot_start
);


-- ──────────────────────────────────────────────────────────────
-- SUMMARY: What this script creates
-- ──────────────────────────────────────────────────────────────
-- ✅ 5 approved clinics + 1 unapproved (admin testing)
-- ✅ 13 doctors across all clinics
-- ✅ 20 clinic services with realistic pricing
-- ✅ 14 time slots per clinic per day × 7 days = ~98 slots per clinic
--    (09:00, 09:30, 10:00, 10:30, 11:00, 11:30, 12:00, 12:30,
--     14:00, 14:30, 15:00, 15:30, 16:00, 16:30)
-- ✅ Slots also created for your existing clinics (shrikant medos, etc.)
