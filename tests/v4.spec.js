import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// v4 · the continuous game (docs/ART_BIBLE.md § 6–12). The full-screen sizes are in tests/field.spec.js, the photo in
// tests/photo.spec.js, /art-lab/ out of the build in tests/art.spec.js.
const hud = (page) => page.locator('.hud-base');
const preview = (page) => page.locator('#field-panel [data-panel]:visible');
const next = (page) => preview(page).locator('[data-action="next-base"]');
const reader = (page) => page.locator('dialog.reader');
const axe = async (page, what) => {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(results.violations.map((v) => `${what} · ${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([]);
};
async function play(page) {
  await page.goto('/play/');
  await page.getByRole('button', { name: /^Skip/ }).click();
  await page.getByRole('button', { name: 'Swing!' }).click();
  await expect(hud(page)).toHaveText('1st base · Nipotyno', { timeout: 15_000 });
}

test.describe('v4 game @ 1280×800, reduced motion', () => {
  test.use({ viewport: { width: 1280, height: 800 } });
  test.beforeEach(async ({ page }) => { await page.emulateMedia({ reducedMotion: 'reduce' }); });

  test('✕ Exit is visible and is the first stop after "Skip to content"; it leads to the title screen', async ({ page }) => {
    await page.goto('/play/');
    const exit = page.getByRole('link', { name: /Exit/ });
    await expect(exit).toBeVisible();
    await expect(exit).toHaveAttribute('href', '/');
    await page.keyboard.press('Tab');
    await expect(page.locator('.skip')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(exit).toBeFocused();
    const outline = await exit.evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(outline).not.toBe('none');
  });

  test('the whole tour: swing → 1st preview → READ → reader → Esc → still on 1st → NEXT → 2nd → 3rd → home → finale', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await play(page);
    await expect(preview(page)).toHaveAttribute('data-panel', 'nipotyno');
    await expect(preview(page).locator('.kicker')).toHaveText('01 · 1st base');
    await page.screenshot({ path: 'tests/screenshots/v4-1st-1280.png' });

    await preview(page).getByRole('link', { name: /^Read/ }).click();
    await expect(reader(page)).toHaveJSProperty('open', true);
    await expect(page).toHaveURL(/\/nipotyno\/$/);
    await expect(reader(page).locator('article.case h1')).toContainText('Nipotyno');
    await expect(reader(page).locator('.reader-count')).toHaveText('1 / 3');
    await expect(reader(page).locator('.reader-back')).toContainText('Back to 1st base');
    await axe(page, 'reader');
    await page.keyboard.press('Escape');
    await expect(reader(page)).toHaveJSProperty('open', false);
    await expect(page).toHaveURL(/\/play\/#nipotyno$/);
    await expect(hud(page)).toHaveText('1st base · Nipotyno');
    await expect(preview(page)).toHaveAttribute('data-panel', 'nipotyno');

    await next(page).click();
    await expect(hud(page)).toHaveText('2nd base · Levante');
    await next(page).click();
    await expect(hud(page)).toHaveText('3rd base · Sensor lab');
    await next(page).click();
    const finale = page.locator('#finale');
    await expect(finale).toBeVisible();
    await expect(page.locator('.hud-diamonds i.is-visited')).toHaveCount(3);
    const photo = finale.locator('img.pc-photo');
    await expect(photo).toHaveAttribute('alt', 'Riccardo Cirillo');
    await expect.poll(() => photo.evaluate((img) => img.complete && img.naturalWidth)).toBeGreaterThan(0);
    await expect(finale.getByRole('link', { name: /Contact & CV/ })).toHaveAttribute('href', '/multiplayer/');
    await axe(page, 'finale');
    await page.screenshot({ path: 'tests/screenshots/v4-finale-1280.png' });
    expect(errors).toEqual([]);
  });

  test('the browser Back button closes the reader and leaves the visitor on the base', async ({ page }) => {
    await play(page);
    await preview(page).getByRole('link', { name: /^Read/ }).click();
    await expect(page).toHaveURL(/\/nipotyno\/$/);
    await page.goBack();
    await expect(reader(page)).toHaveJSProperty('open', false);
    await expect(page).toHaveURL(/\/play\/#nipotyno$/);
    await expect(preview(page)).toHaveAttribute('data-panel', 'nipotyno');
    // the reader's NEXT BASE closes it and runs on
    await preview(page).getByRole('link', { name: /^Read/ }).click();
    await reader(page).getByRole('button', { name: /Next base/ }).click();
    await expect(hud(page)).toHaveText('2nd base · Levante');
    await expect(page).toHaveURL(/\/play\/#levante$/);
  });

  test('/play/#levante opens the game on 2nd base, already reached; the visited bases are kept for the visit', async ({ page }) => {
    await page.goto('/play/#levante');
    await expect(hud(page)).toHaveText('2nd base · Levante');
    await expect(preview(page)).toHaveAttribute('data-panel', 'levante');
    await expect(page.locator('.hud-diamonds i.is-visited')).toHaveCount(1);
    await page.goto('/play/');
    await expect(page.locator('.hud-diamonds i.is-visited')).toHaveCount(1); // sessionStorage
  });

  test('axe on every screen: uniform, at bat, preview, pause menu', async ({ page }) => {
    await page.goto('/play/');
    await axe(page, 'uniform');
    await page.getByRole('button', { name: /^Skip/ }).click();
    await axe(page, 'at bat');
    await page.goto('/play/#nipotyno');
    await axe(page, 'preview');
    await page.keyboard.press('Escape');
    await axe(page, 'pause');
  });

  test('reduced motion: no animation on the people, no fireworks, flash or shake, the finale card just appears', async ({ page }) => {
    await play(page);
    expect(await page.locator('.runner').evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
    await expect(page.locator('.fireworks')).toBeHidden();
    await expect(page.locator('.flash')).toBeHidden();
    expect(await page.locator('.halo').first().evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
    for (let i = 0; i < 3; i++) await next(page).click();
    expect(await page.locator('#finale .player-card').evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
  });
});

test.describe('v4 game @ 1280×800 with motion', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('home run: impact pause, flash and shake, HOME RUN on the scoreboard, fireworks; no console errors', async ({ page }) => {
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto('/play/');
    await expect(page.locator('.stage')).toHaveClass(/lights-on/);
    await page.getByRole('button', { name: /^Skip/ }).click();
    await page.evaluate(() => {
      window.__seen = new Set();
      const note = () => { for (const c of ['is-impact', 'is-flash', 'is-shake', 'is-homerun']) if (document.querySelector('.stage').classList.contains(c)) window.__seen.add(c); if (document.querySelector('.scoreboard').classList.contains('is-home-run')) window.__seen.add('scoreboard'); };
      new MutationObserver(note).observe(document.querySelector('.stage'), { attributes: true, subtree: true, attributeFilter: ['class'] });
    });
    await page.getByRole('button', { name: 'Swing!' }).click();
    await expect.poll(() => page.evaluate(() => [...window.__seen].sort()), { timeout: 15_000 }).toEqual(['is-flash', 'is-homerun', 'is-impact', 'is-shake', 'scoreboard']);
    await expect(hud(page)).toHaveText('1st base · Nipotyno', { timeout: 15_000 });
    await expect(page.locator('[data-crew="coach1"]')).toHaveClass(/is-highfive/);
    expect(errors).toEqual([]);
  });
});

test.describe('v4 game @ 390×844 (phone)', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test('the preview is a sheet at the bottom with READ and NEXT BASE; the finale stacks the card over the text; axe', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await play(page);
    const sheet = await page.locator('#field-panel').boundingBox();
    expect(Math.round(sheet.y + sheet.height)).toBe(844);
    await expect(preview(page).getByRole('link', { name: /^Read/ })).toBeInViewport();
    await expect(next(page)).toBeInViewport();
    await axe(page, 'phone preview');
    await page.screenshot({ path: 'tests/screenshots/v4-1st-390.png' });
    for (let i = 0; i < 3; i++) await next(page).tap();
    await expect(page.locator('#finale')).toBeVisible();
    const card = await page.locator('#finale .player-card').boundingBox();
    const text = await page.locator('#finale .finale-text').boundingBox();
    expect(card.y + card.height).toBeLessThanOrEqual(text.y);
    await axe(page, 'phone finale');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
});

test.describe('v4 without JavaScript', () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 1280, height: 800 } });

  test('/play/ is the still stadium with the bases as real links and the mode bar; no HUD controls, no finale', async ({ page }) => {
    await page.goto('/play/');
    await expect(page.locator('.layer-field')).toBeVisible();
    await expect(page.locator('.mode-bar')).toBeVisible();
    await expect(page.locator('.hud-exit')).toBeHidden();
    await expect(page.locator('#finale')).toBeHidden();
    const hrefs = await page.locator('.stage .base').evaluateAll((links) => links.map((a) => [a.dataset.stop, a.getAttribute('href')]));
    expect(hrefs).toEqual([['home', '/multiplayer/'], ['nipotyno', '/nipotyno/'], ['levante', '/levante/'], ['sensor-lab', '/sensor-lab/']]);
  });
});
