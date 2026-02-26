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
export async function updateProfile(userId: string, data: { name: string; phone: string | null }) {
  const { error } = await supabase
    .from('profiles')
    .update({ name: data.name, phone: data.phone })
    .eq('id', userId);
  if (error) throw error;
}
