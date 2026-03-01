export type AppRole = 'user' | 'clinic' | 'admin';
export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled';

export interface Profile {
  id: string;
  name: string;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
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
  created_at: string;
}

export interface TimeSlot {
  id: string;
  clinic_id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  created_at: string;
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
