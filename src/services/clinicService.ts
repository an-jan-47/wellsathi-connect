import { supabase } from '@/integrations/supabase/client';
import type { Clinic } from '@/types';
import type { SortOption } from '@/constants';

export interface SearchFilters {
  location?: string;
  specialty?: string;
  maxFees?: string;
  minRating?: string;
  sortBy?: SortOption;
}

/**
 * Search for approved clinics with filtering and sorting.
 */
export async function searchClinics(filters: SearchFilters): Promise<Clinic[]> {
  let query = supabase
    .from('clinics')
    .select('id, name, city, address, fees, rating, images, specializations, phone, is_approved')
    .eq('is_approved', true)
    .limit(20);

  if (filters.location) {
    query = query.ilike('city', `%${filters.location}%`);
  }

  if (filters.specialty) {
    query = query.contains('specializations', [filters.specialty]);
  }

  if (filters.maxFees) {
    query = query.lte('fees', parseInt(filters.maxFees));
  }

  if (filters.minRating) {
    query = query.gte('rating', parseFloat(filters.minRating));
  }

  const sortBy = filters.sortBy || 'rating';
  switch (sortBy) {
    case 'fees_low':
      query = query.order('fees', { ascending: true });
      break;
    case 'fees_high':
      query = query.order('fees', { ascending: false });
      break;
    case 'name':
      query = query.order('name', { ascending: true });
      break;
    case 'rating':
    default:
      query = query.order('rating', { ascending: false, nullsFirst: false });
      break;
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as Clinic[]) || [];
}

/**
 * Fetch a single clinic by ID.
 */
export async function getClinicById(clinicId: string): Promise<Clinic | null> {
  const { data, error } = await supabase
    .from('clinics')
    .select('*')
    .eq('id', clinicId)
    .maybeSingle();
  if (error) throw error;
  return data as Clinic | null;
}

/**
 * Fetch clinic owned by a specific user.
 */
export async function getClinicByOwner(ownerId: string): Promise<Clinic | null> {
  const { data, error } = await supabase
    .from('clinics')
    .select('*')
    .eq('owner_id', ownerId)
    .maybeSingle();
  if (error) throw error;
  return data as Clinic | null;
}

/**
 * Fetch clinic with doctors and services (for profile page).
 */
export async function getClinicProfile(clinicId: string) {
  const [clinicRes, doctorsRes, servicesRes] = await Promise.all([
    supabase.from('clinics').select('*').eq('id', clinicId).maybeSingle(),
    supabase.from('doctors').select('*').eq('clinic_id', clinicId),
    supabase.from('clinic_services').select('*').eq('clinic_id', clinicId).order('service_name'),
  ]);

  if (clinicRes.error) throw clinicRes.error;

  return {
    clinic: clinicRes.data as Clinic | null,
    doctors: doctorsRes.data || [],
    services: servicesRes.data || [],
  };
}

/**
 * Update clinic approval status (admin only).
 */
export async function updateClinicApproval(clinicId: string, isApproved: boolean) {
  const { error } = await supabase
    .from('clinics')
    .update({ is_approved: isApproved })
    .eq('id', clinicId);
  if (error) throw error;
}

/**
 * Fetch all clinics for admin dashboard.
 */
export async function getAllClinics(): Promise<Clinic[]> {
  const { data, error } = await supabase
    .from('clinics')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as Clinic[]) || [];
}
