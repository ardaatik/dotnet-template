export const TOKEN_STORAGE_KEY = 'dotnet_template_tokens';

export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
}

export function loadStoredTokens(): StoredTokens | null {
  const storedTokens = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (!storedTokens) {
    return null;
  }

  try {
    return JSON.parse(storedTokens) as StoredTokens;
  } catch {
    return null;
  }
}

export function saveStoredTokens(tokens: StoredTokens): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
}

export function clearStoredTokens(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export function hasValidTokenPair(tokens: StoredTokens | null): tokens is StoredTokens {
  return !!(tokens?.accessToken && tokens?.refreshToken);
}

export function getStoredAccessToken(): string | null {
  return loadStoredTokens()?.accessToken ?? null;
}

export function getStoredRefreshToken(): string | null {
  return loadStoredTokens()?.refreshToken ?? null;
}
