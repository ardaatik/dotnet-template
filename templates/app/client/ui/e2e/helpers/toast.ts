import { expect, type Page } from '@playwright/test';

export async function expectSuccessToast(page: Page, message: string) {
  const toast = page
    .getByRole('region', { name: /Notifications/i })
    .getByText(message, { exact: true })
    .last();
  await expect(toast).toBeVisible();
}
