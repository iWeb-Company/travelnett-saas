'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '@/lib/api';
import { useRouter, usePathname } from 'next/navigation';

interface User {
  id: string;
  iweb_client_id: string;
  name: string;
  last_name: string;
  username: string;
}

interface IwebClient {
  id: string;
  folder_id: number;
  slug: string;
  name: string;
  cuit: number;
  email: string;
  status: boolean;
  logo_xl: string;
  logo_s: string;
}

interface AuthContextType {
  user: User | null;
  iwebClient: IwebClient | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  token: string | null;
  login: (slug: string, username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [iwebClient, setIwebClient] = useState<IwebClient | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      if (!user && pathname !== '/login') {
        router.push('/login');
      } else if (user && pathname === '/login') {
        router.push('/dashboard');
      }
    }
  }, [isLoading, user, pathname, router]);

  useEffect(() => {
    const restoreSession = async () => {
      setIsLoading(true);
      try {
        const storedClient = localStorage.getItem('iweb_client');

        // Relies on HTTP-Only cookie automatically sent by the browser
        const userData = await apiClient.getMe();
        setUser(userData);

        if (storedClient) {
          try {
            setIwebClient(JSON.parse(storedClient));
          } catch {
            localStorage.removeItem('iweb_client');
          }
        }
      } catch {
        setUser(null);
        setIwebClient(null);
        localStorage.removeItem('iweb_client');
      } finally {
        setIsLoading(false);
      }
    };
    restoreSession();
  }, []);

  const login = async (slug: string, username: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await apiClient.loginSystem({ slug, username, password });

      if (result.iweb_client) {
        setIwebClient(result.iweb_client);
        localStorage.setItem('iweb_client', JSON.stringify(result.iweb_client));
      }
      const userData = await apiClient.getMe();
      setUser(userData);
    } catch (error) {
      setUser(null);
      setIwebClient(null);
      localStorage.removeItem('iweb_client');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setIwebClient(null);
    localStorage.removeItem('iweb_client');
    apiClient.logout().finally(() => {
      window.location.href = '/login';
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        iwebClient,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
