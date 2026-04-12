import { supabase } from '@/integrations/supabase/client';

/**
 * Fetch admin dashboard statistics.
 */
export async function getAdminStats() {
  const [usersRes, appointmentsRes] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('appointments').select('id', { count: 'exact', head: true }),
  ]);
  return {
    totalUsers: usersRes.count || 0,
    totalAppointments: appointmentsRes.count || 0,
  };
}

/**
 * Update user profile.
 */
export async function updateProfile(userId: string, data: { 
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
}) {
  const { error } = await supabase
    .from('profiles')
    .update({ 
      name: data.name, 
      phone: data.phone,
      ...(data.gender !== undefined && { gender: data.gender }),
      ...(data.age !== undefined && { age: data.age }),
      ...(data.address !== undefined && { address: data.address }),
    })
    .eq('id', userId);
  if (error) throw error;
}
