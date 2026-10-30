import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Organization } from '../types';
import { api } from '../api/client';

interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  demoLogin: () => Promise<void>;
  signup: (email: string, password: string, organizationName: string) => Promise<void>;
  logout: () => void;
  updateOrganizationState: (updatedOrg: Partial<Organization>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => api.getToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(() => {
    api.setToken(null);
    setToken(null);
    setUser(null);
  }, []);

  // Set up 401 callback in ApiClient
  useEffect(() => {
    api.setOnUnauthorized(() => {
      logout();
    });
  }, [logout]);

  // Initial token validation and user profile hydration on page refresh
  useEffect(() => {
    const initializeAuth = async () => {
      const existingToken = api.getToken();
      if (!existingToken) {
        setIsLoading(false);
        return;
      }

      try {
        const { user: profile } = await api.auth.me();
        setUser(profile);
        setToken(existingToken);
      } catch (err) {
        console.warn('Session expired or invalid token:', err);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [logout]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.auth.login({ email, password });
      api.setToken(res.token);
      setToken(res.token);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const demoLogin = async () => {
    setIsLoading(true);
    try {
      const res = await api.auth.demoLogin();
      api.setToken(res.token);
      setToken(res.token);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, organizationName: string) => {
    setIsLoading(true);
    try {
      const res = await api.auth.signup({ email, password, organizationName });
      api.setToken(res.token);
      setToken(res.token);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrganizationState = (updatedOrg: Partial<Organization>) => {
    if (user && user.organization) {
      setUser({
        ...user,
        organization: {
          ...user.organization,
          ...updatedOrg,
        },
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        organization: user?.organization || null,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        demoLogin,
        signup,
        logout,
        updateOrganizationState,
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
