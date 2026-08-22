import type { Locator } from '@playwright/test';

/** Click through Playwright; fall back to DOM click when headed Firefox stalls. */
export async function clickReliably(locator: Locator) {
  await locator.scrollIntoViewIfNeeded();
  try {
    await locator.click({ timeout: 5_000 });
  } catch {
    await locator.evaluate(node => (node as HTMLElement).click());
  }
}
