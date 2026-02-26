import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getUserAppointments, getClinicAppointments, getClinicUpcomingAppointments,
  cancelAppointment, bookAppointment,
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

/** Cancel an appointment and free its slot. */
export function useCancelAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cancelAppointment,
    onSuccess: () => {
      toast.success('Appointment cancelled');
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
