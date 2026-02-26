-- Phase 3: Database Performance Optimizations
-- Adds missing indexes identified in the technical audit

-- clinic_services: Needed for clinic profile page queries
CREATE INDEX IF NOT EXISTS idx_clinic_services_clinic_id 
  ON clinic_services(clinic_id);

-- reviews: Needed for clinic profile page, user review lookup
CREATE INDEX IF NOT EXISTS idx_reviews_clinic_id 
  ON reviews(clinic_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id 
  ON reviews(user_id);

-- appointments: Status-based filtering (admin/clinic dashboards)
CREATE INDEX IF NOT EXISTS idx_appointments_status 
  ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_date_status 
  ON appointments(date, status);
