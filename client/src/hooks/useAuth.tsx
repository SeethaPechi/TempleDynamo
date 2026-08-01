import React, { createContext, useContext, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest, getQueryFn } from '@/lib/queryClient';
import type { User } from '@shared/schema';

export type AuthUser = Omit<User, 'password'>;

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, captchaToken?: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery<Omit<User, 'password'> | null>({
    queryKey: ['/api/auth/me'],
    queryFn: getQueryFn<Omit<User, 'password'> | null>({ on401: "returnNull" }),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const loginMutation = useMutation({
    mutationFn: async ({ email, password, captchaToken }: { email: string; password: string; captchaToken?: string }) => {
      const response = await apiRequest('POST', '/api/auth/login', { email, password, captchaToken });
      return response;
    },
    onSuccess: (userData) => {
      queryClient.setQueryData(['/api/auth/me'], userData);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/auth/logout');
    },
    onSuccess: () => {
      queryClient.setQueryData(['/api/auth/me'], null);
      queryClient.clear();
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await apiRequest('POST', '/api/auth/register', userData);
      return response;
    },
  });

  const login = async (email: string, password: string, captchaToken?: string) => {
    await loginMutation.mutateAsync({ email, password, captchaToken });
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  const register = async (userData: any) => {
    await registerMutation.mutateAsync(userData);
  };

  const value = {
    user: user || null,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    register,
  };

  return (
    <AuthContext.Provider value={value}>
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