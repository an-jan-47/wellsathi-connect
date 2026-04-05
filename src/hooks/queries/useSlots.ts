import { useQuery } from '@tanstack/react-query';
import { getAvailableSlots, getAllSlots } from '@/services/slotService';

/**
 * Fetch available slots for a doctor on a date.
 * Polls every 30s only while the tab is visible to reduce API load.
 */
export function useAvailableSlots(doctorId: string | undefined, date: string) {
  return useQuery({
    queryKey: ['slots', doctorId, date, 'available'],
    queryFn: () => getAvailableSlots(doctorId!, date),
    enabled: !!doctorId && !!date,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
}

/**
 * Fetch all slots (including unavailable) for a doctor on a date.
 * Polls every 30s only while the tab is visible.
 */
export function useAllSlots(doctorId: string | undefined, date: string) {
  return useQuery({
    queryKey: ['slots', doctorId, date, 'all'],
    queryFn: () => getAllSlots(doctorId!, date),
    enabled: !!doctorId && !!date,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
}
