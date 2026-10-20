'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AuthenticatedUser } from '@/types/auth';
import { createClient } from '@/lib/supabase/client';

export interface SignupResponse {
  user?: AuthenticatedUser;
  requiresEmailConfirmation?: boolean;
  message?: string;
}

interface AuthContextType {
  user: AuthenticatedUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthenticatedUser | undefined>;
  signup: (data: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    role?: 'customer' | 'cook';
  }) => Promise<SignupResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      const json = await res.json();
      if (json.success && json.data?.user) {
        setUser(json.data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function initAuth() {
      try {
        const res = await fetch('/api/auth/me');
        const json = await res.json();
        if (isMounted) {
          if (json.success && json.data?.user) {
            setUser(json.data.user);
          } else {
            setUser(null);
          }
        }
      } catch {
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initAuth();

    // Listen to Supabase client auth state changes for real-time sync
    try {
      const supabase = createClient();
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          refreshUser();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsLoading(false);
        }
      });

      return () => {
        isMounted = false;
        subscription.unsubscribe();
      };
    } catch {
      return () => {
        isMounted = false;
      };
    }
  }, [refreshUser]);

  const login = async (email: string, password: string): Promise<AuthenticatedUser | undefined> => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const json = await res.json();

    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || 'Login failed');
    }

    if (json.data?.user) {
      setUser(json.data.user);
      return json.data.user;
    }
  };

  const signup = async (data: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    role?: 'customer' | 'cook';
  }): Promise<SignupResponse> => {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const json = await res.json();

    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || 'Signup failed');
    }

    if (json.data?.user && !json.data?.requiresEmailConfirmation) {
      setUser(json.data.user);
    }

    return {
      user: json.data?.user,
      requiresEmailConfirmation: json.data?.requiresEmailConfirmation,
      message: json.data?.message,
    };
  };

  const logout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // Non-blocking
    }

    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Non-blocking
    }

    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
