export type AppRole = 'user' | 'clinic' | 'admin';
export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled';

export interface Profile {
  id: string;
  name: string;
  phone: string | null;
  role: AppRole;
  created_at: string;
  updated_at: string;
}

export interface Clinic {
  id: string;
  owner_id: string | null;
  name: string;
  address: string;
  city: string;
  fees: number;
  phone: string | null;
  description: string | null;
  specializations: string[] | null;
  is_approved: boolean;
  rating: number | null;
  image_url: string | null;
  images: string[] | null;
  certificates: string[] | null;
  registration_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface Doctor {
  id: string;
  clinic_id: string;
  name: string;
  specialization: string;
  bio: string | null;
  image_url: string | null;
  experience_years?: number;
  fee?: number;
  email_id?: string | null;
  created_at: string;
}

export interface DoctorSchedule {
  id: string;
  doctor_id: string;
  clinic_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  break_start: string | null;
  break_end: string | null;
  slot_duration: number;
  is_working_day: boolean;
  created_at: string;
  updated_at: string;
}

export interface DoctorSlotOverride {
  id: string;
  doctor_id: string;
  override_date: string;
  start_time: string | null;
  end_time: string | null;
  is_available: boolean;
  reason: string | null;
  created_at: string;
}

export interface TimeSlot {
  id?: string;
  clinic_id?: string;
  doctor_id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export interface Appointment {
  id: string;
  clinic_id: string;
  user_id: string | null;
  doctor_id?: string | null;
  patient_name: string;
  patient_phone: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  notes: string | null;
  total_fee?: number;
  created_at: string;
  updated_at: string;
  clinic?: Clinic;
  doctors?: {
    id: string;
    name: string;
    specialization: string;
  };
  booking_services?: {
    fee: number;
    clinic_services: {
      service_name: string;
    };
  }[];
}

export interface BookingService {
  id: string;
  appointment_id: string;
  service_id: string;
  fee: number;
  created_at: string;
}

export interface Review {
  id: string;
  clinic_id: string;
  user_id: string;
  appointment_id: string | null;
  rating: number;
  comment: string | null;
  images?: string[] | null;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
}

export interface SearchFilters {
  location: string;
  specialty: string;
  minFees?: number;
  maxFees?: number;
  minRating?: number;
}
