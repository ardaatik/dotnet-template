import { AccountInfo } from '@azure/msal-browser';
import { useMsal } from '@azure/msal-react';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { API_BASE_URL } from '@/api/config';
import { exchangeToken } from '@/api/auth';
import { getUserFromToken, isAccessTokenExpired } from '@/utils/jwtUtils';
import {
  clearStoredTokens,
  hasValidTokenPair,
  loadStoredTokens,
  saveStoredTokens,
} from '@/utils/authStorage';
import {
  initializeAuthHandlers,
  refreshSessionOnce,
  shouldClearSessionOnRefreshFailure,
} from '@/utils/fetchUtils';

interface AuthContextType {
  isAuthenticated: boolean;
  account: AccountInfo | null;
  accessToken: string | null;
  refreshToken: string | null;
  user: ReturnType<typeof getUserFromToken>;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CLIENT_ID = import.meta.env.VITE_ENTRA_CLIENT_ID;
const API_SCOPES = [`api://${CLIENT_ID}/API.Read`];

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { instance, accounts } = useMsal();
  const account = accounts[0] ?? null;

  const initialTokens = loadStoredTokens();

  const [accessToken, setAccessToken] = useState<string | null>(
    () => initialTokens?.accessToken ?? null
  );
  const [refreshToken, setRefreshToken] = useState<string | null>(
    () => initialTokens?.refreshToken ?? null
  );
  const [isAuthenticated, setIsAuthenticated] = useState(() => hasValidTokenPair(initialTokens));

  const storeTokens = useCallback((at: string, rt: string) => {
    setAccessToken(at);
    setRefreshToken(rt);
    saveStoredTokens({ accessToken: at, refreshToken: rt });
    setIsAuthenticated(true);
  }, []);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setRefreshToken(null);
    clearStoredTokens();
    setIsAuthenticated(false);
  }, []);

  useEffect(() => {
    initializeAuthHandlers({
      getAccessToken: () => accessToken,
      getRefreshToken: () => refreshToken,
      onTokenRefreshed: storeTokens,
      onSessionExpired: clearSession,
    });
  }, [accessToken, refreshToken, storeTokens, clearSession]);

  useEffect(() => {
    const stored = loadStoredTokens();
    if ((stored?.accessToken || stored?.refreshToken) && !hasValidTokenPair(stored)) {
      clearSession();
    }
  }, [clearSession]);

  useEffect(() => {
    const stored = loadStoredTokens();
    if (!hasValidTokenPair(stored) || !isAccessTokenExpired(stored.accessToken)) {
      return;
    }

    const storedRefreshToken = stored.refreshToken;
    let cancelled = false;

    async function refreshSession() {
      try {
        const tokens = await refreshSessionOnce(storedRefreshToken);
        if (!cancelled) {
          storeTokens(tokens.accessToken, tokens.refreshToken);
        }
      } catch {
        if (!cancelled && shouldClearSessionOnRefreshFailure(storedRefreshToken)) {
          clearSession();
        }
      }
    }

    void refreshSession();

    return () => {
      cancelled = true;
    };
  }, [clearSession, storeTokens]);

  const login = useCallback(async () => {
    const entraResponse = await instance.loginPopup({ scopes: API_SCOPES });
    const tokens = await exchangeToken(entraResponse.accessToken);
    storeTokens(tokens.accessToken, tokens.refreshToken);
  }, [instance, storeTokens]);

  const logout = useCallback(async () => {
    if (refreshToken) {
      try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
      } catch {
        // continue client logout
      }
    }

    clearSession();
    await instance.logoutRedirect({ account: account ?? undefined });
  }, [instance, account, refreshToken, clearSession]);

  const value = useMemo(
    () => ({
      isAuthenticated,
      account,
      accessToken,
      refreshToken,
      user: getUserFromToken(accessToken),
      login,
      logout,
    }),
    [isAuthenticated, account, accessToken, refreshToken, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
