import { useQuery } from '@tanstack/react-query';
import { getAvailableSlots, getAllSlots } from '@/services/slotService';

/** Fetch available slots for a clinic on a date. */
export function useAvailableSlots(clinicId: string | undefined, date: string) {
  return useQuery({
    queryKey: ['slots', clinicId, date, 'available'],
    queryFn: () => getAvailableSlots(clinicId!, date),
    enabled: !!clinicId && !!date,
    refetchInterval: 10000, // Auto-refresh every 10s to prevent stale availability
  });
}

/** Fetch all slots (including unavailable) for a clinic on a date. */
export function useAllSlots(clinicId: string | undefined, date: string) {
  return useQuery({
    queryKey: ['slots', clinicId, date, 'all'],
    queryFn: () => getAllSlots(clinicId!, date),
    enabled: !!clinicId && !!date,
    refetchInterval: 10000, // Auto-refresh every 10s
  });
}
