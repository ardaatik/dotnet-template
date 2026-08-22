export interface JwtPayload {
  [key: string]: any;
  exp?: number;
  sub?: string;
  email?: string;
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'?: string;
  todos?: string[];
  users?: string[];
  permission?: string[];
}

/** True when the access token is missing, unreadable, or past its exp (with optional buffer). */
export function isAccessTokenExpired(
  accessToken: string | null,
  bufferSeconds = 30
): boolean {
  if (!accessToken) return true;
  const payload = decodeJwt(accessToken);
  const exp = payload?.exp;
  if (typeof exp !== 'number') return true;
  return Date.now() >= (exp - bufferSeconds) * 1000;
}

export function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export function getUserFromToken(token: string | null): {
  id: string;
  email: string;
  role: string;
  claims: {
    todos: string[];
    users: string[];
    permission: string[];
  };
} | null {
  if (!token) return null;

  const payload = decodeJwt(token);
  if (!payload) return null;

  return {
    id: payload.sub || '',
    email: payload.email || '',
    role: payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || '',
    claims: {
      todos: payload.todos || [],
      users: payload.users || [],
      permission: payload.permission || [],
    },
  };
}

export function hasRole(token: string | null, role: string): boolean {
  const user = getUserFromToken(token);
  return user?.role === role;
}

export function hasAnyRole(token: string | null, roles: string[]): boolean {
  const user = getUserFromToken(token);
  return user ? roles.includes(user.role) : false;
}

export function hasClaim(token: string | null, claimType: string, claimValue: string): boolean {
  const user = getUserFromToken(token);
  if (!user) return false;

  const claims = user.claims[claimType as keyof typeof user.claims];
  return Array.isArray(claims) && claims.includes(claimValue);
}

export function hasPermission(token: string | null, permission: string): boolean {
  return hasClaim(token, 'permission', permission);
}
