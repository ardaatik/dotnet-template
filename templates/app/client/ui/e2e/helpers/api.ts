import { APIRequestContext } from '@playwright/test';
import { API_BASE_URL, E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD } from './constants';

interface AccessTokens {
  accessToken: string;
  refreshToken: string;
}

export async function loginViaApi(request: APIRequestContext): Promise<AccessTokens> {
  const response = await request.post(`${API_BASE_URL}/auth/login`, {
    data: {
      email: E2E_ADMIN_EMAIL,
      password: E2E_ADMIN_PASSWORD,
    },
  });

  if (!response.ok()) {
    throw new Error(`Login failed: ${response.status()} ${await response.text()}`);
  }

  const body = await response.json();
  return {
    accessToken: body.accessToken,
    refreshToken: body.refreshToken,
  };
}
