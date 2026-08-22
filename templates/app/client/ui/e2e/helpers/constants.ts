export const E2E_ADMIN_EMAIL = 'e2e-admin@test.local';
export const E2E_ADMIN_PASSWORD = 'E2e_Admin123!';
export const API_BASE_URL = process.env.E2E_API_URL ?? 'http://localhost:5050/api';

export function uniqueName(prefix: string): string {
  return `${prefix}-${Date.now()}`;
}
