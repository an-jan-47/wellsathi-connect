import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminStats, updateProfile } from '@/services/profileService';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';

/** Fetch admin dashboard stats. */
export function useAdminStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: getAdminStats,
  });
}

/** Update user profile. */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, data }: { 
      userId: string; 
      data: { 
        name: string; 
        phone: string | null;
        gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
        age?: number | null;
        address?: {
          street?: string;
          city?: string;
          state?: string;
          postal_code?: string;
          country?: string;
        } | null;
      } 
    }) => updateProfile(userId, data),
    onSuccess: (_, { userId }) => {
      toast.success('Profile updated');
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      // Refresh auth store profile
      useAuthStore.getState().fetchUserData(userId);
    },
    onError: () => {
      toast.error('Failed to update profile');
    },
  });
}
