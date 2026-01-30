import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Profile, AppRole } from '@/types';

interface ClinicRegistrationData {
  ownerName: string;
  email: string;
  phone: string;
  password: string;
  clinicName: string;
  address: string;
  city: string;
  fees: number;
  specializations?: string;
  description?: string;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  isLoading: boolean;
  isInitialized: boolean;
  
  initialize: () => Promise<() => void>;
  fetchUserData: (userId: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, name: string, phone?: string) => Promise<{ error: Error | null }>;
  signUpClinic: (data: ClinicRegistrationData) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  roles: [],
  isLoading: true,
  isInitialized: false,

  initialize: async () => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        set({ session, user: session?.user ?? null });
        
        if (session?.user) {
          setTimeout(() => {
            get().fetchUserData(session.user.id);
          }, 0);
        } else {
          set({ profile: null, roles: [], isLoading: false });
        }
      }
    );

    const { data: { session } } = await supabase.auth.getSession();
    set({ session, user: session?.user ?? null, isInitialized: true });
    
    if (session?.user) {
      await get().fetchUserData(session.user.id);
    } else {
      set({ isLoading: false });
    }

    return () => subscription.unsubscribe();
  },

  fetchUserData: async (userId: string) => {
    try {
      const [profileRes, rolesRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        supabase.from('user_roles').select('role').eq('user_id', userId),
      ]);

      set({
        profile: profileRes.data as Profile | null,
        roles: (rolesRes.data?.map(r => r.role as AppRole) ?? []),
        isLoading: false,
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
      set({ isLoading: false });
    }
  },

  signIn: async (email, password) => {
    set({ isLoading: true });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    set({ isLoading: false });
    return { error };
  },

  signUp: async (email, password, name, phone) => {
    set({ isLoading: true });
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { name, phone },
      },
    });
    
    set({ isLoading: false });
    return { error };
  },

  signUpClinic: async (data: ClinicRegistrationData) => {
    set({ isLoading: true });
    const redirectUrl = `${window.location.origin}/`;
    
    try {
      // Step 1: Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: { 
            name: data.ownerName, 
            phone: data.phone,
            is_clinic_owner: true,
          },
        },
      });
      
      if (authError) {
        set({ isLoading: false });
        return { error: authError };
      }

      if (!authData.user) {
        set({ isLoading: false });
        return { error: new Error('Failed to create user account') };
      }

      // Step 2: Add clinic role to user
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: authData.user.id, role: 'clinic' });

      if (roleError) {
        console.error('Error adding clinic role:', roleError);
      }

      // Step 3: Create clinic record
      const specializations = data.specializations
        ? data.specializations.split(',').map(s => s.trim()).filter(Boolean)
        : [];

      const { error: clinicError } = await supabase
        .from('clinics')
        .insert({
          owner_id: authData.user.id,
          name: data.clinicName,
          address: data.address,
          city: data.city,
          fees: data.fees,
          phone: data.phone,
          description: data.description || null,
          specializations,
          is_approved: false, // Requires admin approval
        });

      if (clinicError) {
        console.error('Error creating clinic:', clinicError);
        set({ isLoading: false });
        return { error: clinicError };
      }

      set({ isLoading: false });
      return { error: null };
    } catch (error) {
      set({ isLoading: false });
      return { error: error as Error };
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, profile: null, roles: [], isLoading: false });
  },

  hasRole: (role) => get().roles.includes(role),
}));
