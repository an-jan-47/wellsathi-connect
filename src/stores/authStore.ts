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
  
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, name: string, phone?: string) => Promise<{ error: Error | null }>;
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
    if (error) set({ isLoading: false });
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
    
    if (error) set({ isLoading: false });
    return { error };
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, profile: null, roles: [], isLoading: false });
  },

  hasRole: (role) => get().roles.includes(role),
}));

// Add fetchUserData to the store type
declare module 'zustand' {
  interface AuthState {
    fetchUserData: (userId: string) => Promise<void>;
  }
}
