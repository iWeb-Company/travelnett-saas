'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '@/lib/api';
import { useRouter, usePathname } from 'next/navigation';
import toast from 'react-hot-toast';

export interface UserPermissions {
  salidas: boolean;
  paquetes: boolean;
  administracion: boolean;
  parametros: boolean;
  web: boolean;
  permisos_users: boolean;
}

interface User {
  id: string;
  iweb_client_id: string;
  name: string;
  last_name: string;
  username: string;
  rol?: string;
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
  permissions: UserPermissions;
  login: (slug: string, username: string, password: string) => Promise<void>;
  logout: () => void;
}

const defaultFullPermissions: UserPermissions = {
  salidas: true,
  paquetes: true,
  administracion: true,
  parametros: true,
  web: true,
  permisos_users: true,
};

const defaultEmptyPermissions: UserPermissions = {
  salidas: false,
  paquetes: false,
  administracion: false,
  parametros: false,
  web: false,
  permisos_users: false,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const normalizeText = (str: string) =>
  (str || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [iwebClient, setIwebClient] = useState<IwebClient | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [permissions, setPermissions] = useState<UserPermissions>(defaultEmptyPermissions);
  const router = useRouter();
  const pathname = usePathname();

  const [permissionsLoaded, setPermissionsLoaded] = useState(false);

  const loadPermissionsForUser = async (u: User) => {
    const rawRole = u.rol || "admin";
    const userRoleNorm = normalizeText(rawRole);

    if (u.username === "iweb_admin" || userRoleNorm === "admin") {
      setPermissions(defaultFullPermissions);
      setPermissionsLoaded(true);
      return;
    }

    try {
      const permsList = await apiClient.getPermissions(u.iweb_client_id).catch(() => []);
      const matched = permsList.find(
        (p: any) => {
          const normPName = normalizeText(p.name || "");
          const normPId = normalizeText(p.id || "");
          return (
            normPName === userRoleNorm ||
            (p.id || "") === rawRole ||
            normPId === userRoleNorm ||
            normPName.replace("adminstr", "administr") === userRoleNorm.replace("adminstr", "administr")
          );
        }
      );

      if (matched) {
        setPermissions({
          salidas: Boolean(matched.salidas),
          paquetes: Boolean(matched.paquetes),
          administracion: Boolean(matched.administracion),
          parametros: Boolean(matched.parametros),
          web: Boolean(matched.web),
          permisos_users: Boolean(matched.permisos_users),
        });
      } else {
        setPermissions({
          salidas: false,
          paquetes: false,
          administracion: false,
          parametros: false,
          web: false,
          permisos_users: false,
        });
      }
    } catch {
      setPermissions({
        salidas: false,
        paquetes: false,
        administracion: false,
        parametros: false,
        web: false,
        permisos_users: false,
      });
    } finally {
      setPermissionsLoaded(true);
    }
  };

  useEffect(() => {
    if (!isLoading && permissionsLoaded) {
      if (!user && pathname !== '/login') {
        router.replace('/login');
        return;
      }
      if (user && pathname === '/login') {
        router.replace('/dashboard');
        return;
      }

      if (user) {
        const isAdmin = user.username === 'iweb_admin' || normalizeText(user.rol || '') === 'admin';
        if (!isAdmin) {
          let allowed = true;
          if (pathname.startsWith('/salidas') && !permissions.salidas) allowed = false;
          else if (pathname.startsWith('/paquetes') && !permissions.paquetes) allowed = false;
          else if (pathname.startsWith('/administracion') && !permissions.administracion) allowed = false;
          else if (pathname.startsWith('/parametros') && !permissions.parametros) allowed = false;
          else if (pathname.startsWith('/web') && !permissions.web) allowed = false;
          else if (pathname.startsWith('/usuarios') && !permissions.permisos_users) allowed = false;

          if (!allowed) {
            toast.error("No tienes permisos para acceder a esta sección");
            const targetRedirect = permissions.administracion ? '/administracion' :
                                  permissions.salidas ? '/salidas' :
                                  permissions.paquetes ? '/paquetes' :
                                  permissions.parametros ? '/parametros' :
                                  permissions.web ? '/web' :
                                  permissions.permisos_users ? '/usuarios' : '/dashboard';
            router.replace(targetRedirect);
          }
        }
      }
    }
  }, [isLoading, permissionsLoaded, user, permissions, pathname, router]);

  useEffect(() => {
    const restoreSession = async () => {
      setIsLoading(true);
      try {
        const storedClient = localStorage.getItem('iweb_client');

        // Relies on HTTP-Only cookie automatically sent by the browser
        const userData = await apiClient.getMe();
        setUser(userData);
        await loadPermissionsForUser(userData);

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
        if (typeof window !== 'undefined') {
          document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
          if (pathname !== '/login') {
            window.location.href = '/login';
          }
        }
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
      await loadPermissionsForUser(userData);
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
        permissions,
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
