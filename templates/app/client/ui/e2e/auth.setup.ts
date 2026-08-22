import { test as setup, expect } from '@playwright/test';
import { TOKEN_STORAGE_KEY } from '../src/utils/authStorage';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loginViaApi } from './helpers/api';
import { API_BASE_URL } from './helpers/constants';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const authFile = path.join(__dirname, '.auth/admin.json');

setup('authenticate as E2E admin', async ({ page, request }) => {
  fs.mkdirSync(path.dirname(authFile), { recursive: true });

  const tokens = await loginViaApi(request);

  const todosResponse = await request.get(`${API_BASE_URL}/todos?pageSize=1`, {
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
      Accept: 'application/vnd.dotnet-template.hateoas+json',
    },
  });

  expect(todosResponse.ok(), 'Todos API should be reachable during E2E setup').toBeTruthy();

  await page.goto('/login');

  await page.evaluate(
    ({ accessToken, refreshToken, storageKey }) => {
      localStorage.setItem(storageKey, JSON.stringify({ accessToken, refreshToken }));
      localStorage.setItem('isAuthenticated', 'true');
    },
    { ...tokens, storageKey: TOKEN_STORAGE_KEY }
  );

  await page.context().storageState({ path: authFile });
});
