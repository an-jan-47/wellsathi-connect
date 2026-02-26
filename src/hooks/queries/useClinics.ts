import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  searchClinics, getClinicById, getClinicByOwner, getClinicProfile,
  getAllClinics, updateClinicApproval,
} from '@/services/clinicService';
import type { SearchFilters } from '@/services/clinicService';
import { toast } from 'sonner';

/** Search clinics with filters. */
export function useSearchClinics(filters: SearchFilters) {
  return useQuery({
    queryKey: ['clinics', 'search', filters],
    queryFn: () => searchClinics(filters),
  });
}

/** Get a single clinic by ID. */
export function useClinic(clinicId: string | undefined) {
  return useQuery({
    queryKey: ['clinics', clinicId],
    queryFn: () => getClinicById(clinicId!),
    enabled: !!clinicId,
  });
}

/** Get clinic owned by a user. */
export function useClinicByOwner(ownerId: string | undefined) {
  return useQuery({
    queryKey: ['clinics', 'byOwner', ownerId],
    queryFn: () => getClinicByOwner(ownerId!),
    enabled: !!ownerId,
  });
}

/** Get full clinic profile (clinic + doctors + services). */
export function useClinicProfile(clinicId: string | undefined) {
  return useQuery({
    queryKey: ['clinics', clinicId, 'profile'],
    queryFn: () => getClinicProfile(clinicId!),
    enabled: !!clinicId,
  });
}

/** Get all clinics for admin. */
export function useAllClinics() {
  return useQuery({
    queryKey: ['clinics', 'all'],
    queryFn: getAllClinics,
  });
}

/** Approve or reject a clinic. */
export function useUpdateClinicApproval() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clinicId, isApproved }: { clinicId: string; isApproved: boolean }) =>
      updateClinicApproval(clinicId, isApproved),
    onSuccess: (_, { isApproved }) => {
      toast.success(`Clinic ${isApproved ? 'approved' : 'rejected'}`);
      queryClient.invalidateQueries({ queryKey: ['clinics'] });
    },
    onError: () => {
      toast.error('Failed to update clinic status');
    },
  });
}
