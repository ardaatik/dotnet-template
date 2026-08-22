import { API_BASE_URL } from '@/api/config';
import {
  clearStoredTokens,
  hasValidTokenPair,
  loadStoredTokens,
  saveStoredTokens,
} from '@/utils/authStorage';
import { getUserFromToken } from '@/utils/jwtUtils';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { initializeAuthHandlers } from '../utils/fetchUtils';

interface AuthContextType {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  user: ReturnType<typeof getUserFromToken>;
  login: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [tokens] = useState(() => loadStoredTokens());
  const [accessToken, setAccessToken] = useState<string | null>(tokens?.accessToken ?? null);
  const [refreshToken, setRefreshToken] = useState<string | null>(tokens?.refreshToken ?? null);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true' && hasValidTokenPair(tokens);
  });

  const login = useCallback((newAccessToken: string, newRefreshToken: string) => {
    setAccessToken(newAccessToken);
    setRefreshToken(newRefreshToken);
    saveStoredTokens({ accessToken: newAccessToken, refreshToken: newRefreshToken });
    setIsAuthenticated(true);
  }, []);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setRefreshToken(null);
    clearStoredTokens();
    setIsAuthenticated(false);
  }, []);

  useEffect(() => {
    const storedTokens = loadStoredTokens();
    if (storedTokens) {
      setAccessToken(storedTokens.accessToken);
      setRefreshToken(storedTokens.refreshToken);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('isAuthenticated', isAuthenticated.toString());
  }, [isAuthenticated]);

  useEffect(() => {
    initializeAuthHandlers({
      getAccessToken: () => accessToken,
      getRefreshToken: () => refreshToken,
      onTokenRefreshed: login,
      onSessionExpired: clearSession,
    });
  }, [accessToken, refreshToken, login, clearSession]);

  const logout = useCallback(async () => {
    if (refreshToken) {
      try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        });
      } catch (error) {
        console.error('Failed to logout on server:', error);
      }
    }

    clearSession();
  }, [refreshToken, clearSession]);

  const user = getUserFromToken(accessToken);

  const value = {
    isAuthenticated,
    accessToken,
    refreshToken,
    user,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
