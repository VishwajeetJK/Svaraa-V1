import { test, expect } from '@playwright/test';

async function openGuide(page: import('@playwright/test').Page) {
  const dialog = page.getByRole('dialog', { name: 'Svaraa walkthrough' });
  if (await dialog.isVisible().catch(() => false)) return;
  await page.getByRole('button', { name: 'Open Svaraa walkthrough guide' }).click();
  await expect(dialog).toBeVisible();
}

async function startInvestorDemo(page: import('@playwright/test').Page) {
  await page.goto('/');
  await expect(page.getByText('Svaraa').first()).toBeVisible();
  await page.getByRole('button', { name: 'Investor demo' }).click();
  await expect(page.locator('[data-tour="today-title"]')).toBeVisible({ timeout: 60_000 });
}

test.describe('Svaraa smoke', () => {
  test('landing → investor demo → today → guide FAQ', async ({ page }) => {
    await startInvestorDemo(page);

    const guide = page.getByRole('dialog', { name: 'Svaraa walkthrough' });
    await openGuide(page);
    await guide.getByPlaceholder('Ask about SOS, SL1-F, privacy…').fill('Does Svaraa call 112?');
    await guide.getByRole('button', { name: 'Ask', exact: true }).click();
    await expect(guide.getByText(/never auto-dial/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('guide hardware card for SL1-F', async ({ page }) => {
    await page.goto('/');
    await openGuide(page);
    await page.getByRole('button', { name: 'SL1-F' }).click();
    await expect(page.getByText(/privacy slider/i).first()).toBeVisible();
  });

  test('full product walkthrough starts and advances', async ({ page }) => {
    await startInvestorDemo(page);
    await openGuide(page);
    await page.locator('[data-tour="full-walkthrough"]').click();
    await expect(page.getByText(/Step 1 \//i)).toBeVisible();
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByText(/Step 2 \//i)).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('[data-tour="onboarding-title"]')).toBeVisible();
  });

  test('demo → safety drill → incident ack', async ({ page }) => {
    await startInvestorDemo(page);
    await page.getByRole('link', { name: 'Apps' }).click();
    await page.getByRole('button', { name: /^S\s*Safety$|^Safety$/ }).click();
    await expect(page.locator('[data-tour="safety-title"]')).toBeVisible();
    await page.locator('[data-tour="safety-drill"]').click();
    // Investor demo marks onboarding complete, so SOS is live (not drill) — use shell banner.
    await page.getByRole('button', { name: 'Open incident' }).click();
    await expect(page).toHaveURL(/\/incident\//);
    await page.getByRole('button', { name: /I'm on it|I’m on it/ }).click();
    await expect(page.getByText(/acknowledged/i).first()).toBeVisible({ timeout: 10_000 });
  });
});
