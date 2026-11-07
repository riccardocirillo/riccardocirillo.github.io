import { test, expect } from '@playwright/test';

// Batting → home run → tour (one project per base) → free mode. The game never blocks the content.
// The tour never moves on by itself: the visitor presses "Next base" in the card; one browser Back leaves the page.
const count = (page) => page.locator('.hud-base');
const panel = (page) => page.locator('#field-panel [data-panel]:visible');
const bar = (page, mode) => page.locator(`.game-bar [data-mode="${mode}"]`);
// v4: NEXT BASE → sits in the base preview (§ 8); there is no ◀ Back any more (the field itself is the way back).
const nextButton = (page) => panel(page).locator('[data-action="next-base"]');
const status = (page) => page.locator('.game-bar [role="status"]');

test.describe('game @ 1280 px, reduced motion (no pitch, no zoom)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });
  test.beforeEach(async ({ page }) => { await page.emulateMedia({ reducedMotion: 'reduce' }); });

  test('Swing! → home run → tour with Next base / Back to the last card → take another swing', async ({ page }) => {
    await page.goto('/play/');
    await expect(bar(page, 'bat')).toBeVisible();
    // "Home run!" shows for only 0.6 s with reduced motion: record that it appeared instead of racing to see it
    await page.evaluate(() => {
      const banner = document.querySelector('.banner');
      window.__banner = false;
      new MutationObserver(() => { if (!banner.hidden) window.__banner = true; }).observe(banner, { attributes: true, attributeFilter: ['hidden'] });
    });
    await page.getByRole('button', { name: 'Swing!' }).click();
    await expect.poll(() => page.evaluate(() => window.__banner)).toBe(true);

    await expect(count(page)).toHaveText('1st base · Nipotyno');
    await expect(page).toHaveURL(/#nipotyno$/);
    await expect(panel(page)).toHaveAttribute('data-panel', 'nipotyno');
    await expect(panel(page).locator('.panel-cover')).toBeVisible();
    // v4: READ ▶ (yellow) and NEXT BASE → in the preview; no timer, no Pause inside the tour
    await expect(nextButton(page)).toHaveText('Next base →');
    await expect(panel(page).locator('[data-action="read"]')).toContainText('Read');
    await expect(page.locator('.timer, .tour-nav, .game-bar [data-action="pause"], .tour-step')).toHaveCount(0);

    for (const [slug, name] of [['levante', 'Levante'], ['sensor-lab', 'Sensor lab']]) {
      await nextButton(page).click();
      await expect(count(page)).toContainText(name);
      await expect(panel(page)).toHaveAttribute('data-panel', slug);
    }
    // after 3rd base: home plate, then the About me finale with the photo and Contact & CV (§ 10)
    await nextButton(page).click();
    await expect(count(page)).toHaveText('Tour complete');
    await expect(page.locator('#finale')).toBeVisible();
    await expect(page.locator('#finale h2')).toHaveText("Hi, I'm Riccardo");
    await expect(page.locator('#finale img.pc-photo')).toHaveAttribute('alt', 'Riccardo Cirillo');
    await expect(page.locator('#finale').getByRole('link', { name: /Contact & CV/ })).toHaveAttribute('href', '/multiplayer/');
    await expect(page.locator('#finale').getByRole('link', { name: 'Story mode' })).toHaveAttribute('href', '/story/');

    await expect(page.locator('.hud-diamonds i.is-visited')).toHaveCount(3); // the 3 bases
    await expect(page).toHaveURL(/#home$/);

    await page.locator('#finale').getByRole('button', { name: 'Play again' }).click();
    await expect(page.locator('#finale')).toBeHidden();
    await expect(bar(page, 'bat')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Swing!' })).toBeFocused();
    await expect(page.locator('#field-panel')).toBeHidden(); // back at bat: the card closes, the whole field is free
    await expect(page.locator('.tour-nav')).toHaveCount(0);
  });

  test('the diamond fills up as the bases are visited; status and counter agree', async ({ page }) => {
    await page.goto('/play/');
    await page.getByRole('button', { name: 'Swing!' }).click();
    const visited = page.locator('.hud-diamonds i.is-visited');
    await expect(visited).toHaveCount(1);
    await expect(page.locator('.hud-diamonds i.is-current')).toHaveAttribute('data-corner', 'first');
    await expect(status(page)).toHaveText('Tour 1 of 3: Nipotyno.');
    await nextButton(page).click();
    await expect(visited).toHaveCount(2);
    await expect(page.locator('.hud-diamonds i.is-current')).toHaveAttribute('data-corner', 'second');
    await expect(status(page)).toHaveText('Tour 2 of 3: Levante.');
    await expect(page.locator('.scoreboard .sb-bases i.is-on')).toHaveCount(2); // v4: the scoreboard lights them too
  });

  test('Space and a click on the field also swing', async ({ page }) => {
    await page.goto('/play/');
    await page.evaluate(() => document.activeElement?.blur()); // focus on the page, not on a control (v4: the title is for screen readers only)
    await page.keyboard.press('Space');
    await expect(count(page)).toHaveText('1st base · Nipotyno');

    await page.goto('/play/');
    await page.locator('.stage').click({ position: { x: 300, y: 200 } }); // the stands: no base there (the HUD covers the top)
    await expect(count(page)).toHaveText('1st base · Nipotyno');
  });

  test('after the tour one browser Back press leaves the page (the address is replaced, not added to)', async ({ page }) => {
    await page.goto('/levante/');
    await page.goto('/play/');
    await page.getByRole('button', { name: 'Swing!' }).click();
    await expect(count(page)).toHaveText('1st base · Nipotyno');
    await nextButton(page).click();
    await nextButton(page).click();
    await expect(count(page)).toHaveText('3rd base · Sensor lab');
    await expect(page).toHaveURL(/#sensor-lab$/);
    await page.goBack();
    await expect(page).toHaveURL(/\/levante\/$/);
  });

  test('Back in free mode also leaves with one press', async ({ page }) => {
    await page.goto('/levante/');
    await page.goto('/play/');
    await page.locator('.base[data-stop="levante"]').click();
    await page.locator('.base[data-stop="sensor-lab"]').click();
    await expect(page).toHaveURL(/#sensor-lab$/);
    await page.goBack();
    await expect(page).toHaveURL(/\/levante\/$/);
  });

  test('a link to another anchor in the middle of the tour ends it (hash that is not a base)', async ({ page }) => {
    await page.goto('/play/');
    await page.getByRole('button', { name: 'Swing!' }).click();
    await expect(count(page)).toHaveText('1st base · Nipotyno');
    await page.locator('.skip').focus();
    await page.keyboard.press('Enter'); // "Skip to content" → #main: an anchor that is not a base
    await expect(page).toHaveURL(/#main$/);
    await page.goBack(); // back from #main to the base address: free mode, not the tour
    await expect(bar(page, 'free')).toHaveJSProperty('hidden', false); // (the bar itself hides under the preview, v4)
    await expect(bar(page, 'tour')).toBeHidden();
  });

  test('clicking a base, ✕ Close or "Exit tour" leaves the tour; deep links skip the at-bat', async ({ page }) => {
    await page.goto('/play/');
    await page.getByRole('button', { name: 'Swing!' }).click();
    await expect(count(page)).toHaveText('1st base · Nipotyno');
    await page.locator('.base[data-stop="sensor-lab"]').click();
    await expect(bar(page, 'free')).toHaveJSProperty('hidden', false);
    await expect(bar(page, 'tour')).toBeHidden();
    await expect(panel(page)).toHaveAttribute('data-panel', 'sensor-lab');
    await expect(status(page)).toHaveText('Tour ended. Free mode. Sensor lab, 3rd base.');
    await expect(page.locator('.tour-nav')).toHaveCount(0);

    await page.goto('/play/');
    await page.getByRole('button', { name: 'Swing!' }).click();
    await expect(count(page)).toHaveText('1st base · Nipotyno');
    await panel(page).locator('..').getByRole('button', { name: 'Close' }).click(); // v4: ✕ Close on the preview leaves the tour
    await expect(bar(page, 'free')).toHaveJSProperty('hidden', false);
    await expect(status(page)).toHaveText('Tour ended. Free mode.');
    await expect(page.locator('.tour-nav')).toHaveCount(0);

    await page.goto('/play/');
    await page.getByRole('button', { name: 'Swing!' }).click();
    await expect(count(page)).toHaveText('1st base · Nipotyno');
    await page.getByRole('button', { name: 'Close' }).click(); // F5: Esc opens the pause menu; ✕ Close closes the card
    await expect(bar(page, 'free')).toBeVisible();
    await expect(page.locator('#field-panel')).toBeHidden();

    await page.goto('/play/#levante');
    await expect(bar(page, 'free')).toHaveJSProperty('hidden', false); // (under the preview the bar itself is hidden, v4)
    await expect(page.getByRole('button', { name: 'Swing!' })).toBeHidden();
    await expect(panel(page)).toHaveAttribute('data-panel', 'levante');
  });

  test('07/11: straight to the at-bat, no uniform choice, no focus jump; the stage is on the first screen', async ({ page }) => {
    await page.goto('/play/');
    await expect(page.getByRole('button', { name: 'Swing!' })).toBeVisible();
    await expect(page.locator('.uniform-pick, [data-uniform], [data-action="skip-uniform"]')).toHaveCount(0);
    await expect(page.locator('body')).toBeFocused();
    expect(await page.locator('.runner').evaluate((el) => getComputedStyle(el).backgroundPositionY)).toBe('0px'); // Researcher, row 0
    await expect(page.locator('.stage')).toBeInViewport();
  });
});

test.describe('game @ 1280 px with motion', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  // v4: the moments no longer zoom (the camera follows the runner); the class still marks the moment.
  test('high five on 1st base (the moment); Next works during it; nothing moves on by itself', async ({ page }) => {
    test.setTimeout(75_000);
    await page.goto('/play/');

    await page.getByRole('button', { name: 'Swing!' }).click();
    await expect(page.locator('.banner')).toBeVisible({ timeout: 10_000 });
    await expect(count(page)).toHaveText('1st base · Nipotyno', { timeout: 10_000 });
    await expect(page.locator('.stage')).toHaveClass(/is-moment/, { timeout: 10_000 });
    await expect(page.locator('.runner')).toHaveClass(/is-highfive/);
    await expect(page.locator('[data-crew="coach1"]')).toHaveClass(/is-highfive/);
    await page.screenshot({ path: 'tests/screenshots/tour-highfive-1280.png' });

    // no change of base without a click: wait 15 s on the card
    await page.waitForTimeout(15_000);
    await expect(count(page)).toHaveText('1st base · Nipotyno');
    await expect(panel(page)).toHaveAttribute('data-panel', 'nipotyno');

    // Next works while a moment is playing: go on and click again during the zoom of the next stop
    await nextButton(page).click();
    await expect(count(page)).toHaveText('2nd base · Levante');
    await expect(page.locator('.stage')).toHaveClass(/is-moment/, { timeout: 5_000 });
    await nextButton(page).click(); // the zoom is still on
    await expect(count(page)).toHaveText('3rd base · Sensor lab', { timeout: 10_000 });
  });
});

test.describe('game @ 390 px (touch)', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test('tap Swing! → tour on the phone: the card has its own Next, no sideways scroll', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/play/');
    await page.getByRole('button', { name: 'Swing!' }).tap();
    await expect(count(page)).toHaveText('1st base · Nipotyno');
    await nextButton(page).tap();
    await expect(panel(page)).toHaveAttribute('data-panel', 'levante');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);
    // the HUD with the diamonds fits the screen
    const map = await page.locator('.hud-diamonds').boundingBox();
    expect(map.x + map.width).toBeLessThanOrEqual(390);
  });
});
