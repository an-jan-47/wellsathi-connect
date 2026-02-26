import { supabase } from '@/integrations/supabase/client';
import type { TimeSlot } from '@/types';

/**
 * Fetch available slots for a clinic on a specific date.
 */
export async function getAvailableSlots(clinicId: string, date: string): Promise<TimeSlot[]> {
  const { data, error } = await supabase
    .from('time_slots')
    .select('*')
    .eq('clinic_id', clinicId)
    .eq('date', date)
    .eq('is_available', true)
    .order('start_time');
  if (error) throw error;
  return (data as TimeSlot[]) || [];
}

/**
 * Fetch all slots (available and unavailable) for a clinic on a date.
 */
export async function getAllSlots(clinicId: string, date: string): Promise<TimeSlot[]> {
  const { data, error } = await supabase
    .from('time_slots')
    .select('*')
    .eq('clinic_id', clinicId)
    .eq('date', date)
    .order('start_time');
  if (error) throw error;
  return (data as TimeSlot[]) || [];
}
