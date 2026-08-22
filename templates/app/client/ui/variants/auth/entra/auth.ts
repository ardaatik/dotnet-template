import { API_BASE_URL, handleApiResponse } from '@/api/config';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export async function exchangeToken(entraAccessToken: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/token`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${entraAccessToken}`,
    },
  });

  return handleApiResponse<AuthResponse>(response);
}

export async function refresh(refreshToken: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  return handleApiResponse<AuthResponse>(response);
}
