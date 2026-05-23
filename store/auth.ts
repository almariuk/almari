import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import type { UserIdentity, UserProfile } from '@/types/database';

interface AuthState {
  session: Session | null;
  initialized: boolean;
  identityLoading: boolean;
  identity: UserIdentity | null;
  profile: UserProfile | null;
  setSession: (session: Session | null) => void;
  setInitialized: (initialized: boolean) => void;
  setIdentityLoading: (loading: boolean) => void;
  setIdentity: (identity: UserIdentity | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  initialized: false,
  identityLoading: false,
  identity: null,
  profile: null,
  setSession: (session) => set({ session }),
  setInitialized: (initialized) => set({ initialized }),
  setIdentityLoading: (loading) => set({ identityLoading: loading }),
  setIdentity: (identity) => set({ identity }),
  setProfile: (profile) => set({ profile }),
  clear: () => set({ session: null, identityLoading: false, identity: null, profile: null }),
}));
