import { expect, type Locator, type Page } from '@playwright/test';

const aggregateOptionPattern = /^(All|None)$/i;

function listboxForTrigger(page: Page, listboxId: string) {
  return page.locator(`[id="${listboxId}"]`);
}

function searchboxForListbox(page: Page, listboxId: string) {
  return page.locator(`[aria-controls="${listboxId}"][role="searchbox"]`);
}

async function readListboxId(trigger: Locator) {
  const listboxId = await trigger.getAttribute('aria-controls');
  if (!listboxId) {
    throw new Error('SearchableSelect trigger is missing aria-controls');
  }
  return listboxId;
}

/** Adjust listbox.scrollTop only; never scroll dialog ancestors (that closes the portaled popover). */
async function scrollOptionIntoListbox(option: Locator) {
  await option.evaluate(optionEl => {
    const option = optionEl as HTMLElement;
    const listbox = option.closest('[role="listbox"]') as HTMLElement | null;
    if (!listbox) {
      throw new Error('Option is not inside a listbox');
    }

    const listboxRect = listbox.getBoundingClientRect();
    const optionRect = option.getBoundingClientRect();

    if (optionRect.top < listboxRect.top) {
      listbox.scrollTop -= listboxRect.top - optionRect.top;
    } else if (optionRect.bottom > listboxRect.bottom) {
      listbox.scrollTop += optionRect.bottom - listboxRect.bottom;
    }
  });
}

async function resolveListboxOption(listbox: Locator, optionLabel: string) {
  let option = listbox.getByRole('option', { name: optionLabel, exact: true });
  if ((await option.count()) === 0) {
    // Table pickers show tableName as the option label but accept full "db.schema.table" search text.
    option = listbox.getByRole('option').filter({ hasNotText: aggregateOptionPattern }).first();
  }
  return option;
}

async function clickListboxOption(listbox: Locator, optionLabel: string) {
  const option = await resolveListboxOption(listbox, optionLabel);
  await expect(option).toBeAttached();

  await expect
    .poll(async () => {
      await scrollOptionIntoListbox(option);
      return option.evaluate(optionEl => {
        const option = optionEl as HTMLElement;
        const listbox = option.closest('[role="listbox"]') as HTMLElement | null;
        if (!listbox) return false;

        const listboxRect = listbox.getBoundingClientRect();
        const optionRect = option.getBoundingClientRect();
        return optionRect.top >= listboxRect.top && optionRect.bottom <= listboxRect.bottom;
      });
    })
    .toBe(true);

  await option.evaluate(node => (node as HTMLButtonElement).click());
}

/**
 * Wait for the portaled popover to close after selection.
 * Never use page.keyboard.press('Escape') — a global Escape dismisses parent dialogs.
 */
async function ensurePopoverClosed(page: Page, listboxId: string, listbox: Locator) {
  if (!(await listbox.isVisible())) {
    return;
  }

  try {
    await expect(listbox).toBeHidden({ timeout: 2_000 });
    return;
  } catch {
    const searchbox = searchboxForListbox(page, listboxId);
    if (await searchbox.isVisible()) {
      await searchbox.press('Escape');
    }
  }

  await expect(listbox).toBeHidden();
}

/** Open without Playwright scrollIntoView — dialog scroll closes the portaled options list. */
async function openSearchableSelect(
  page: Page,
  trigger: Locator,
  listboxId: string,
  openViaClick = false
) {
  const listbox = listboxForTrigger(page, listboxId);
  if (await listbox.isVisible()) {
    return;
  }

  if (openViaClick) {
    await trigger.evaluate(node => (node as HTMLElement).click());
  } else {
    await trigger.evaluate(node => (node as HTMLElement).focus({ preventScroll: true }));
    await trigger.press('ArrowDown');
  }

  // Modal popover hides the trigger from the a11y tree while open.
  await expect(listbox).toBeVisible();
}

/**
 * Select an option in SearchableSelect using the search box, then a programmatic click.
 * Avoids mouse clicks on portaled options (intercepted by dialog fields) and avoids
 * keyboard navigation picking "All"/"None" when allowAll is enabled.
 */
export async function selectSearchableOption(
  page: Page,
  trigger: Locator,
  optionLabel: string,
  options?: { skipIfSelected?: boolean; skipSearch?: boolean; openViaClick?: boolean }
) {
  const skipIfSelected = options?.skipIfSelected ?? true;
  const skipSearch = options?.skipSearch ?? false;
  const openViaClick = options?.openViaClick ?? false;
  const listboxId = await readListboxId(trigger);
  const listbox = listboxForTrigger(page, listboxId);
  const searchbox = searchboxForListbox(page, listboxId);

  if (skipIfSelected) {
    const currentLabel = await trigger.locator('span').first().textContent();
    const trimmed = currentLabel?.trim();
    if (trimmed && trimmed !== '0' && trimmed === optionLabel) {
      return;
    }
  }

  await openSearchableSelect(page, trigger, listboxId, openViaClick);

  if (skipSearch) {
    await clickListboxOption(listbox, optionLabel);
  } else {
    await expect(searchbox).toBeAttached();
    await searchbox.fill(optionLabel);
    await clickListboxOption(listbox, optionLabel);
  }

  await ensurePopoverClosed(page, listboxId, listbox);
}
