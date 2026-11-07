import { test, expect } from '@playwright/test';

// Finishing pass of 07/11/2026: every Story page leads back and on, CVs open in a new tab, and the way back from 404 and the game.
const CHAPTERS = [
  { path: '/story/', prev: null, next: /Nipotyno/, where: 'Warm-up' },
  { path: '/nipotyno/', prev: /Previous chapter: Hi, I'm Riccardo/, prevHref: '/story/', next: /Levante/, where: 'Chapter 1 of 3' },
  { path: '/levante/', prev: /Previous chapter: Nipotyno/, prevHref: '/nipotyno/', next: /Sensor lab/, where: 'Chapter 2 of 3' },
  { path: '/sensor-lab/', prev: /Previous chapter: Levante/, prevHref: '/levante/', next: null, where: 'Chapter 3 of 3' },
];

for (const c of CHAPTERS) {
  test(`${c.path}: says where you are, and leads back and on`, async ({ page }) => {
    await page.goto(c.path);
    await expect(page.locator('.chapter-progress')).toContainText(c.where);
    const nav = page.locator('.chapter-nav');
    if (c.prev) {
      await expect(nav.locator('a[rel="prev"]')).toHaveText(c.prev);
      await expect(nav.locator('a[rel="prev"]')).toHaveAttribute('href', c.prevHref);
    } else await expect(nav.locator('.to-title-link')).toHaveAttribute('href', '/');
    if (c.next) await expect(nav.locator('a[rel="next"]')).toHaveText(c.next);
    else await expect(nav.locator('.to-title-link')).toHaveAttribute('href', '/');
  });
}

for (const [prefix, word] of [['/es', 'Capítulo anterior'], ['/it', 'Capitolo precedente']]) {
  test(`${prefix}/levante/: the previous chapter link is translated and stays in the language`, async ({ page }) => {
    await page.goto(`${prefix}/levante/`);
    const prev = page.locator('.chapter-nav a[rel="prev"]');
    await expect(prev).toContainText(word);
    await expect(prev).toHaveAttribute('href', `${prefix}/nipotyno/`);
  });
}

test.describe('CV links', () => {
  for (const [path, hidden] of [['/', '(PDF, opens in a new tab)'], ['/es/multiplayer/', '(PDF, se abre en una pestaña nueva)'], ['/it/nipotyno/', '(PDF, si apre in una nuova scheda)'], ['/play/#levante', '(PDF, opens in a new tab)']]) {
    test(`${path}: every CV link opens in a new tab and says so`, async ({ page }) => {
      await page.goto(path);
      const links = await page.locator('a[href^="/cv/"]').all();
      expect(links.length).toBeGreaterThan(0);
      for (const link of links) {
        await expect(link).toHaveAttribute('target', '_blank');
        await expect(link).toHaveAttribute('rel', 'noopener');
        await expect(link.locator('.visually-hidden')).toHaveText(hidden);
      }
    });
  }
  test('the header offers the CV of the language of the page where it exists', async ({ page }) => {
    for (const [path, file] of [['/nipotyno/', 'EN'], ['/es/nipotyno/', 'ES'], ['/it/nipotyno/', 'EN']]) {
      await page.goto(path);
      await expect(page.locator('.cv-top')).toHaveAttribute('href', `/cv/CV_Riccardo_Cirillo_${file}.pdf`);
    }
  });
});

test.describe('the way back', () => {
  test('404: with a page of the site behind it, the first link goes back there; from outside it is not shown', async ({ page }) => {
    await page.goto('/404.html');
    await expect(page.locator('[data-back]')).toBeHidden();
    await page.goto('/levante/');
    await page.evaluate(() => { const a = document.createElement('a'); a.href = '/404.html'; a.id = 'lost'; a.textContent = 'x'; document.body.append(a); });
    await page.locator('#lost').click();
    const back = page.locator('[data-back] a');
    await expect(back).toBeVisible();
    await expect(back).toHaveAttribute('href', /\/levante\/$/);
    await back.click();
    await expect(page).toHaveURL(/\/levante\/$/);
  });

  test('Gameplay: the pause menu leads back to the page the visitor came from', async ({ page }) => {
    await page.goto('/levante/');
    await page.locator('.mode-bar').getByRole('link', { name: 'Gameplay' }).click();
    await page.locator('.hud-pause').click(); // visible only once the game has loaded
    const back = page.locator('dialog.pause [data-back]');
    await expect(back).toBeVisible();
    await back.click();
    await expect(page).toHaveURL(/\/levante\/$/);
  });

  test('Gameplay opened directly: no such item', async ({ page }) => {
    await page.goto('/play/');
    await page.locator('.hud-pause').click();
    await expect(page.locator('dialog.pause')).toHaveJSProperty('open', true);
    await expect(page.locator('dialog.pause [data-back]')).toBeHidden();
  });
});

test('the title screen has no menu hint, in any language', async ({ page }) => {
  for (const home of ['/', '/es/', '/it/']) {
    await page.goto(home);
    await expect(page.locator('.menu-hint')).toHaveCount(0);
    await expect(page.locator('main')).not.toContainText(/choose · |elegir · |scegli · /);
  }
});
