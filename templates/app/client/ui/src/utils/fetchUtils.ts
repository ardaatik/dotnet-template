import { resolveApiUrl } from '../api/config';
import { AuthResponse, refresh } from '../api/auth';
import { getStoredAccessToken, getStoredRefreshToken } from './authStorage';

type RequestInit = Parameters<typeof fetch>[1];

type AuthContextHandlers = {
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  onTokenRefreshed: (accessToken: string, refreshToken: string) => void;
  onSessionExpired?: () => void;
};

let authHandlers: AuthContextHandlers | null = null;

export function initializeAuthHandlers(handlers: AuthContextHandlers) {
  authHandlers = handlers;
}

interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  traceId?: string;
}

export class ApiError extends Error {
  details?: ProblemDetails;
  status?: number;

  constructor(message: string, details?: ProblemDetails, status?: number) {
    super(message);
    this.details = details;
    this.status = status;
  }
}

let refreshPromise: Promise<AuthResponse> | null = null;
let refreshPromiseToken: string | null = null;

/** Single in-flight refresh shared by AuthContext and fetchWithAuth. */
export function refreshSessionOnce(refreshToken: string): Promise<AuthResponse> {
  if (refreshPromise && refreshPromiseToken === refreshToken) {
    return refreshPromise;
  }

  refreshPromiseToken = refreshToken;
  refreshPromise = refresh(refreshToken).finally(() => {
    refreshPromise = null;
    refreshPromiseToken = null;
  });

  return refreshPromise;
}

/** Prefer localStorage so another tab/window's refresh is visible immediately. */
function resolveAccessToken(fallback: string | null): string | null {
  return authHandlers?.getAccessToken() ?? getStoredAccessToken() ?? fallback;
}

function resolveRefreshToken(): string | null {
  return authHandlers?.getRefreshToken() ?? getStoredRefreshToken();
}

/** Avoid clearing session when another tab or concurrent refresh already rotated tokens. */
export function shouldClearSessionOnRefreshFailure(failedRefreshToken: string): boolean {
  const current = getStoredRefreshToken() ?? authHandlers?.getRefreshToken();
  if (current && current !== failedRefreshToken) {
    return false;
  }
  return true;
}

export async function fetchWithAuth<T>(
  url: string,
  accessToken: string | null,
  options: RequestInit = {}
): Promise<T> {
  const token = resolveAccessToken(accessToken);
  if (!token) {
    throw new Error('No access token available');
  }

  const defaultHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const resolvedUrl = resolveApiUrl(url);
  const response = await fetch(resolvedUrl, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (response.status === 401) {
    let refreshTokenUsed: string | null = null;
    try {
      if (!authHandlers) {
        throw new Error('Auth handlers not initialized');
      }

      refreshTokenUsed = resolveRefreshToken();
      if (!refreshTokenUsed) {
        throw new Error('No refresh token available');
      }

      const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
        await refreshSessionOnce(refreshTokenUsed);

      authHandlers.onTokenRefreshed(newAccessToken, newRefreshToken);

      return fetchWithAuth<T>(url, newAccessToken, options);
    } catch {
      if (refreshTokenUsed && shouldClearSessionOnRefreshFailure(refreshTokenUsed)) {
        authHandlers?.onSessionExpired?.();
      }
      throw new Error('Session expired. Please login again.');
    }
  }

  if (!response.ok) {
    const errorData = await response.json();
    throw new ApiError(
      errorData.detail || errorData.message || `HTTP error! status: ${response.status}`,
      errorData,
      response.status
    );
  }

  if (response.status === 204) {
    return null as T;
  }
  try {
    return await response.json();
  } catch {
    return null as T;
  }
}
