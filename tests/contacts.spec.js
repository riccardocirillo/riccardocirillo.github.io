import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Finishing pass of 07/11/2026: the email copies on click, LinkedIn sits right after it in the three places of the contacts.
const EMAIL = 'riccardo.cirillo.work@gmail.com';
const LINKEDIN = 'https://www.linkedin.com/in/riccardocirillo';

test.describe('copy the email', () => {
  test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

  for (const [path, where, word, tag] of [
    ['/multiplayer/', '.ticket', 'Email copied', 'copy'],
    ['/es/multiplayer/', 'footer', 'Email copiado', 'copiar'],
    ['/it/nipotyno/', 'footer', 'Email copiata', 'copia'],
  ]) {
    test(`${path} (${where}): a click copies it and shows "${word}" for about 2 s; the page does not leave`, async ({ page }) => {
      await page.goto(path);
      const link = page.locator(`${where} a[data-copy]`);
      await expect(link.locator('.copy-tag')).toHaveText(tag);
      await expect(link.locator('.copy-tag')).toBeVisible();
      await expect(link).toHaveCSS('text-decoration-line', 'none');
      await link.click();
      const toast = page.locator('.copy-toast');
      await expect(toast).toHaveText(word);
      await expect(toast).toHaveAttribute('aria-live', 'polite');
      await expect(toast).toBeVisible();
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(EMAIL);
      await expect(page).toHaveURL(new RegExp(`${path}$`));
      await page.waitForTimeout(1500);
      await expect(toast).toHaveText(word);
      await expect(toast).toBeEmpty({ timeout: 1500 });
    });
  }

  test('the game\'s Contact card copies too', async ({ page }) => {
    await page.goto('/play/#home');
    await page.locator('#field-panel [data-panel="home"] a[data-copy]').click();
    await expect(page.locator('.copy-toast')).toHaveText('Email copied');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(EMAIL);
  });

  test('axe: no errors with the message on screen', async ({ page }) => {
    await page.goto('/multiplayer/');
    await page.locator('.ticket a[data-copy]').click();
    await expect(page.locator('.copy-toast')).toHaveText('Email copied');
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(results.violations.map((v) => `${v.id} (${v.nodes.length})`)).toEqual([]);
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('the email stays a mailto and no "copy" tag shows', async ({ page }) => {
    await page.goto('/multiplayer/');
    const link = page.locator('.ticket a[data-copy]');
    await expect(link).toHaveAttribute('href', `mailto:${EMAIL}`);
    await expect(link.locator('.copy-tag')).toBeHidden();
  });
});

test.describe('LinkedIn', () => {
  for (const [path, label] of [
    ['/multiplayer/', 'LinkedIn profile (opens in a new tab)'],
    ['/es/multiplayer/', 'Perfil de LinkedIn (se abre en una pestaña nueva)'],
    ['/it/multiplayer/', 'Profilo LinkedIn (si apre in una nuova scheda)'],
  ]) {
    test(`${path}: right after the email on the ticket and in the footer, never in the header`, async ({ page }) => {
      await page.goto(path);
      for (const where of ['.ticket', 'footer']) {
        const link = page.locator(`${where} a[href="${LINKEDIN}"]`);
        await expect(link).toHaveText('LinkedIn');
        await expect(link).toHaveAttribute('target', '_blank');
        await expect(link).toHaveAttribute('rel', 'me noopener');
        await expect(link).toHaveAttribute('aria-label', label);
        const order = await page.locator(`${where} a[data-copy], ${where} a[href="${LINKEDIN}"]`).evaluateAll((els) => els.map((a) => a.href.slice(0, 6)));
        expect(order).toEqual(['mailto', 'https:']);
      }
      await expect(page.locator(`header a[href="${LINKEDIN}"]`)).toHaveCount(0);
    });
  }
  test('in the game\'s Contact card', async ({ page }) => {
    await page.goto('/play/#home');
    await expect(page.locator(`#field-panel [data-panel="home"] a[href="${LINKEDIN}"]`)).toBeVisible();
  });
});
