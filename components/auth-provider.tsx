'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import type { Session, User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase/client';
import type { Profile } from '@/lib/database.types';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (params: {
    email: string;
    password: string;
    fullName: string;
    college: string;
    year: string;
    branch?: string;
    targetRole?: string;
  }) => Promise<{ error: string | null }>;
  signIn: (params: {
    email: string;
    password: string;
  }) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: string | null }>;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

const XP_PER_LEVEL = 1000;

function xpToNext(level: number): number {
  return level * XP_PER_LEVEL;
}

function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
}

export { xpToNext, getInitials };

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [session, setSession] = React.useState<Session | null>(null);
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [loading, setLoading] = React.useState(true);

  const fetchProfile = React.useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      return;
    }
    setProfile(data);
  }, []);

  React.useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      if (!mounted) return;
      setSession(existingSession);
      if (existingSession?.user) {
        fetchProfile(existingSession.user.id).finally(() => {
          if (mounted) setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        (async () => {
          await fetchProfile(newSession.user.id);
        })();
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signUp = React.useCallback(
    async (params: {
      email: string;
      password: string;
      fullName: string;
      college: string;
      year: string;
      branch?: string;
      targetRole?: string;
    }): Promise<{ error: string | null }> => {
      const { data, error } = await supabase.auth.signUp({
        email: params.email,
        password: params.password,
        options: {
          data: {
            full_name: params.fullName,
            college: params.college,
            year: params.year,
            branch: params.branch || '',
            target_role: params.targetRole || '',
          },
        },
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user) {
        // The trigger creates the profile row, but we update it with the
        // extra fields the trigger doesn't set.
        await supabase
          .from('profiles')
          .update({
            college: params.college,
            year: params.year,
            branch: params.branch || '',
            target_role: params.targetRole || '',
            full_name: params.fullName,
          })
          .eq('id', data.user.id);

        await fetchProfile(data.user.id);
      }

      return { error: null };
    },
    [fetchProfile]
  );

  const signIn = React.useCallback(
    async (params: {
      email: string;
      password: string;
    }): Promise<{ error: string | null }> => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: params.email,
        password: params.password,
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user) {
        await fetchProfile(data.user.id);
      }

      return { error: null };
    },
    [fetchProfile]
  );

  const signOut = React.useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
    router.push('/login');
  }, [router]);

  const refreshProfile = React.useCallback(async () => {
    if (session?.user) {
      await fetchProfile(session.user.id);
    }
  }, [session, fetchProfile]);

  const updateProfile = React.useCallback(
    async (updates: Partial<Profile>): Promise<{ error: string | null }> => {
      if (!session?.user) return { error: 'Not authenticated' };

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', session.user.id);

      if (error) {
        return { error: error.message };
      }

      await fetchProfile(session.user.id);
      return { error: null };
    },
    [session, fetchProfile]
  );

  const value: AuthContextValue = {
    user: session?.user ?? null,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    refreshProfile,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
