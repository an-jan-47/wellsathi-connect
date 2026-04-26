import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Profile, AppRole } from '@/types';

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
  signUp: (email: string, password: string, name: string, phone?: string, redirectTo?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
  hasRole: (role: AppRole) => boolean;
  signInWithGoogle: (redirectTo?: string) => Promise<{ error: Error | null }>;
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
          // Seamlessly resume clinic registration if they just verified their email
          if (event === 'SIGNED_IN' && localStorage.getItem('resume_clinic_registration') === 'true') {
            localStorage.removeItem('resume_clinic_registration');
            window.location.href = '/register-clinic';
            return;
          }

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
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      const profile = profileData as Profile | null;
      // Derive roles strictly from the profiles table.
      const roles: AppRole[] = profile?.role ? [profile.role] : ['user'];

      set({
        profile,
        roles,
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

  signUp: async (email, password, name, phone, redirectTo) => {
    set({ isLoading: true });
    
    const baseRedirect = redirectTo 
      ? new URL(redirectTo, window.location.origin).toString() 
      : `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: baseRedirect,
        data: { name, phone },
      },
    });
    
    set({ isLoading: false });
    return { error };
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, profile: null, roles: [], isLoading: false });
  },

  resetPassword: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    return { error };
  },

  updatePassword: async (password) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error };
  },

  hasRole: (role) => get().roles.includes(role),

  signInWithGoogle: async (redirectTo?: string) => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo 
            ? new URL(redirectTo, window.location.origin).toString() 
            : `${window.location.origin}/`,
        },
      });
      
      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      console.error('Error signing in with Google:', error.message);
      return { error };
    }
  },
}));
