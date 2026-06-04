import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useDashboardStore } from '../store/store';
import { api } from '../services/api';

export interface User {
  username: string;
  role: string;
  clan: string;
  avatar: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  permissions: string[];
  login: (credentials: { username: string; role?: string; clan?: string; avatar?: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to encode to base64url
const base64UrlEncode = (str: string): string => {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

// Helper to decode from base64url
const base64UrlDecode = (str: string): string => {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return decodeURIComponent(escape(atob(base64)));
};

// Create a realistic-looking mock JWT token
const createMockToken = (user: User, expInSeconds: number): string => {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    ...user,
    exp: Math.floor(Date.now() / 1000) + expInSeconds,
  };
  return `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(payload))}.mocksignature`;
};

// Decode a JWT token payload
const decodeTokenPayload = (token: string): any => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(base64UrlDecode(parts[1]));
  } catch (e) {
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const refreshTimeoutRef = useRef<any>(null);

  const zustandLogin = useDashboardStore((state) => state.login);
  const zustandLogout = useDashboardStore((state) => state.logout);

  const scheduleTokenRefresh = (expiryTime: number) => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    const now = Math.floor(Date.now() / 1000);
    const delay = (expiryTime - now) * 1000;

    // Refresh 10 seconds before expiry, or immediately if less than 10s left
    const refreshDelay = Math.max(delay - 10000, 0);

    console.warn(`[AuthContext] Token refresh scheduled in ${(refreshDelay / 1000).toFixed(1)}s`);

    refreshTimeoutRef.current = setTimeout(async () => {
      console.warn('[AuthContext] Silent token refresh triggered.');
      await refreshSession();
    }, refreshDelay);
  };

  const refreshSession = async () => {
    const currentToken = localStorage.getItem('codeweaver_auth_token');
    if (!currentToken) return;

    const payload = decodeTokenPayload(currentToken);
    if (!payload) {
      logout();
      return;
    }

    // Refresh token with new 60-second expiration window
    const newSessionUser = {
      username: payload.username,
      role: payload.role,
      clan: payload.clan,
      avatar: payload.avatar,
    };
    const newToken = createMockToken(newSessionUser, 60);

    localStorage.setItem('codeweaver_auth_token', newToken);
    setToken(newToken);
    scheduleTokenRefresh(Math.floor(Date.now() / 1000) + 60);
    console.warn('[AuthContext] Silent token refresh successful.');
  };

  const login = async (credentials: { username: string; role?: string; clan?: string; avatar?: string }) => {
    const newUser: User = {
      username: credentials.username,
      role: credentials.role || 'Chunin',
      clan: credentials.clan || 'Shadow Clan',
      avatar: credentials.avatar || '◈',
    };

    try {
      const response = await api.get<{ permissions: string[] }>(`/api/v1/auth/permissions?role=${newUser.role}`);
      setPermissions(response.data.permissions);
    } catch (e) {
      console.error('[AuthContext] Failed to fetch permissions:', e);
      setPermissions(['view:dashboard']);
    }

    // Token expires in 60 seconds for visual proof-of-work/testing
    const mockToken = createMockToken(newUser, 60);

    localStorage.setItem('codeweaver_auth_token', mockToken);
    setUser(newUser);
    setToken(mockToken);

    // Sync to Zustand global store
    zustandLogin(newUser);

    scheduleTokenRefresh(Math.floor(Date.now() / 1000) + 60);
  };

  const logout = () => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
    localStorage.removeItem('codeweaver_auth_token');
    setUser(null);
    setToken(null);
    setPermissions([]);

    // Sync to Zustand global store
    zustandLogout();
  };

  // Mount logic: restore session
  useEffect(() => {
    const storedToken = localStorage.getItem('codeweaver_auth_token');
    if (storedToken) {
      const payload = decodeTokenPayload(storedToken);
      const now = Math.floor(Date.now() / 1000);

      if (payload && payload.exp > now) {
        const restoredUser = {
          username: payload.username,
          role: payload.role,
          clan: payload.clan,
          avatar: payload.avatar,
        };

        // Fetch permissions for restored session
        api.get<{ permissions: string[] }>(`/api/v1/auth/permissions?role=${restoredUser.role}`)
          .then((res) => setPermissions(res.data.permissions))
          .catch((err) => {
            console.error('[AuthContext] Restore session permissions fetch failed:', err);
            setPermissions(['view:dashboard']);
          });

        setUser(restoredUser);
        setToken(storedToken);
        zustandLogin(restoredUser);
        scheduleTokenRefresh(payload.exp);
      } else {
        // Expired or invalid
        logout();
      }
    }

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, token, permissions, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const usePermission = (permission: string): boolean => {
  const { permissions, user } = useAuth();
  if (user?.role === 'Kage') {
    return true; // Admin bypass
  }
  return permissions.includes(permission);
};
