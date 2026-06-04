import { create } from 'zustand';
import { supabase } from '../supabaseClient';
import { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
  
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,
  initialized: false,

  initialize: async () => {
    try {
      // 1. Get initial session
      const { data: { session } } = await supabase.auth.getSession();
      set({
        session,
        user: session?.user ?? null,
        loading: false,
        initialized: true,
      });

      // 2. Listen for auth changes
      supabase.auth.onAuthStateChange((_event: any, session: any) => {
        set({
          session,
          user: session?.user ?? null,
          loading: false,
        });
      });
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      set({ loading: false, initialized: true });
    }
  },

  signIn: async (email, password) => {
    set({ loading: true });
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (!error && data.session) {
      set({
        session: data.session,
        user: data.session.user,
        loading: false,
      });
    } else {
      set({ loading: false });
    }
    return { error };
  },

  signUp: async (email, password) => {
    set({ loading: true });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Direct email confirmation redirection or auto-confirm depending on Supabase settings
        emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      },
    });
    if (!error && data.session) {
      set({
        session: data.session,
        user: data.session.user,
        loading: false,
      });
    } else {
      set({ loading: false });
    }
    return { error };
  },

  signOut: async () => {
    set({ loading: true });
    const { error } = await supabase.auth.signOut();
    if (!error) {
      set({
        session: null,
        user: null,
        loading: false,
      });
    } else {
      set({ loading: false });
    }
    return { error };
  },
}));
