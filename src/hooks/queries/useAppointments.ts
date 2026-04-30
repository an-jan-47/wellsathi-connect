import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import {
  getUserAppointments, getClinicAppointments, getClinicUpcomingAppointments,
  cancelAppointment, bookAppointment, updateAppointmentStatus, rescheduleAppointment,
  getClinicAppointmentsBatched,
} from '@/services/appointmentService';
import { toast } from 'sonner';

/** Fetch user's appointments. */
export function useUserAppointments(userId: string | undefined) {
  return useQuery({
    queryKey: ['appointments', 'user', userId],
    queryFn: () => getUserAppointments(userId!),
    enabled: !!userId,
  });
}

/** Fetch clinic's appointments for a date. */
export function useClinicAppointments(clinicId: string | undefined, date: string) {
  return useQuery({
    queryKey: ['appointments', 'clinic', clinicId, date],
    queryFn: () => getClinicAppointments(clinicId!, date),
    enabled: !!clinicId,
  });
}

/** Fetch clinic's upcoming appointments. */
export function useClinicUpcomingAppointments(clinicId: string | undefined, fromDate: string) {
  return useQuery({
    queryKey: ['appointments', 'clinic', clinicId, 'upcoming'],
    queryFn: () => getClinicUpcomingAppointments(clinicId!, fromDate),
    enabled: !!clinicId,
  });
}

/** Fetch clinic appointments using infinite scroll. */
export function useInfiniteClinicAppointments(clinicId: string | undefined, type: 'upcoming' | 'past', limit = 20) {
  return useInfiniteQuery({
    queryKey: ['appointments', 'clinic', clinicId, type, 'infinite'],
    queryFn: ({ pageParam = 0 }) => getClinicAppointmentsBatched(clinicId!, type, pageParam as number, limit),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === limit ? allPages.length : undefined;
    },
    enabled: !!clinicId,
  });
}

/** Cancel an appointment and free its slot. */
export function useCancelAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cancelAppointment,
    onSuccess: () => {
      toast.success('Appointment cancelled — slot is now available');
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['slots'] });
    },
    onError: () => {
      toast.error('Failed to cancel appointment');
    },
  });
}

/** Book appointment (atomic). */
export function useBookAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bookAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['slots'] });
    },
  });
}

/** Reschedule appointment (atomic cancel + rebook). */
export function useRescheduleAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: rescheduleAppointment,
    onSuccess: () => {
      toast.success('Appointment rescheduled successfully');
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['slots'] });
    },
    onError: (error: Error) => {
      const msg = error.message?.includes('no longer available')
        ? 'That slot was just booked. Please choose another.'
        : 'Failed to reschedule. Please try again.';
      toast.error(msg);
    },
  });
}
