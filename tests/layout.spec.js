import { test, expect } from '@playwright/test';

// Finishing pass of 07/11/2026 (section 5 of the audit): the bar, the width of the text, the footer, the spaces above the titles.
for (const prefix of ['', '/es', '/it']) {
  test(`${prefix || '/en'}: the mode bar has at most 2 lines at every width, and the CV is never alone on a line`, async ({ page }) => {
    for (let width = 320; width <= 1100; width += 20) {
      await page.setViewportSize({ width, height: 700 });
      if (width === 320) await page.goto(`${prefix}/levante/`);
      const r = await page.evaluate(() => {
        const box = (s) => document.querySelector(s).getBoundingClientRect();
        const items = ['.to-title', '.modes', '.lang-switch', '.cv-top'].map(box);
        const lines = [...new Set(items.map((i) => Math.round(i.top + i.height / 2)))].filter((y, i, all) => !all.some((o, j) => j < i && Math.abs(o - y) < 12));
        const cv = box('.cv-top'), lang = box('.lang-switch');
        return { lines: lines.length, cvWithOthers: Math.abs(cv.top + cv.height / 2 - lang.top - lang.height / 2) < 12, sideways: document.documentElement.scrollWidth > innerWidth, modeRows: new Set([...document.querySelectorAll('.modes li')].map((li) => Math.round(li.getBoundingClientRect().top))).size };
      });
      expect(r.lines, `${width}: lines`).toBeLessThanOrEqual(2);
      expect(r.modeRows, `${width}: modes`).toBe(1);
      expect(r.cvWithOthers, `${width}: CV`).toBe(true);
      expect(r.sideways, `${width}: sideways`).toBe(false);
      if (width >= 800) expect(r.lines, `${width}: one line`).toBe(1);
    }
  });
}

test('the lines of text are never wider between 768 and 1023 px than on a laptop', async ({ page }) => {
  for (const width of [768, 900, 999, 1023, 1280]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/nipotyno/');
    const widest = await page.locator('.chapter-body > section > p').evaluateAll((ps) => Math.max(...ps.map((p) => p.getBoundingClientRect().width)));
    expect(widest, String(width)).toBeLessThanOrEqual(640);
  }
});

test('the footer lines up with the rest of the title screen', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  for (const [path, content] of [['/', '.title-grid'], ['/404.html', '.lost-body']]) {
    await page.goto(path);
    const left = async (s) => Math.round((await page.locator(s).boundingBox()).x);
    expect(await left('.site-footer .wrap'), path).toBe(await left(content));
    expect(await left('.title-bar .bar'), path).toBe(await left(content));
  }
});

test('the same space above every section title of a case', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  for (const path of ['/nipotyno/', '/levante/', '/es/nipotyno/']) {
    await page.goto(path);
    const gaps = await page.locator('.chapter-body > section + section').evaluateAll((sections) => sections.map((s) => Math.round(s.querySelector('h2').getBoundingClientRect().top - s.previousElementSibling.getBoundingClientRect().bottom)));
    expect(new Set(gaps).size, `${path}: ${gaps}`).toBe(1);
  }
});

for (const [path, must, mustNot] of [
  ['/es/nipotyno/', ['facilitador', 'Pedir cita con el especialista', 'Configuración', 'solución híbrida', 'pruebas'], ['moderador', 'Moderé', 'Montaje', 'apaño', 'visita al especialista', ' tests', ' test ']],
  ['/es/levante/', ['panel de control', 'edge AI', 'cocreé'], ['dashboard', 'IA en el borde', 'co-creé']],
  ['/es/multiplayer/', ['Prácticas de UX Research'], ['Becario', 'becario']],
  ['/it/levante/', ['edge AI'], ['IA edge']],
]) {
  test(`${path}: the words of the CV`, async ({ page }) => {
    await page.goto(path);
    const text = await page.locator('body').textContent();
    for (const word of must) expect(text, word).toContain(word);
    for (const word of mustNot) expect(text, word).not.toContain(word);
  });
}

// Revision of 07/11/2026: the game on small screens, the personas on phones, Multiplayer on wide screens.
const SMALL = [[844, 390], [667, 375], [768, 1024], [390, 844], [320, 568]];
for (const [width, height] of SMALL) {
  test(`game @ ${width}×${height}: READ, the finale's title and buttons are on the first screen`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/es/play/');
    await page.locator('[data-action="swing"]').click();
    const next = () => page.locator('#field-panel [data-panel]:visible [data-action="next-base"]');
    await expect(page.locator('#field-panel [data-panel="nipotyno"]')).toBeVisible();
    for (const el of [page.locator('#field-panel [data-panel="nipotyno"] [data-action="read"]'), next()]) await expect(el).toBeInViewport({ ratio: 1 });
    await next().click();
    await next().click();
    await next().click();
    const title = page.locator('.finale-title');
    await expect(title).toBeInViewport({ ratio: 1 });
    for (const button of await page.locator('.finale-actions a, .finale-actions button').all()) await expect(button).toBeInViewport({ ratio: 1 });
    const t = await title.boundingBox();
    const bar = await page.locator('.finale-actions').boundingBox();
    expect(t.y + t.height, 'the buttons do not cover the title').toBeLessThanOrEqual(bar.y);
    expect(bar.y + bar.height, 'the buttons end on screen').toBeLessThanOrEqual(height + 1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('game @ 844×390: the hint does not cover the batter, the reader leaves room for the text', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/play/');
  const hint = await page.locator('.game-bar').boundingBox();
  const runner = await page.locator('.runner').boundingBox();
  expect(hint.y + hint.height <= runner.y || hint.x + hint.width <= runner.x || runner.x + runner.width <= hint.x).toBe(true);
  await page.goto('/play/#levante');
  await page.locator('#field-panel').getByRole('link', { name: /Read/i }).click();
  await expect(page.locator('dialog.reader h1')).toBeVisible();
  expect(await page.locator('.reader-body').evaluate((el) => el.clientHeight)).toBeGreaterThanOrEqual(300);
});

for (const path of ['/levante/', '/es/levante/', '/it/levante/']) {
  test(`${path} @ 390: the personas scroll in their own box at a readable size, the page does not`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(path);
    await expect(page.locator('.wide-image')).toHaveCount(2);
    await expect(page.locator('.wide-hint').first()).toBeVisible();
    const box = page.locator('.wide-image').first();
    expect((await box.locator('img').boundingBox()).width).toBeGreaterThanOrEqual(700);
    expect(await box.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    await box.focus();
    await page.keyboard.press('ArrowRight');
    await expect.poll(() => box.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
  });
}

test('/levante/ @ 1280: the personas fit the column, no scrolling and no hint', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/levante/');
  await expect(page.locator('.wide-hint').first()).toBeHidden();
  expect(await page.locator('.wide-image').first().evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
});

for (const path of ['/multiplayer/', '/es/multiplayer/', '/it/multiplayer/']) {
  test(`${path} @ 1280: the ticket goes across the page, no void under it`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(path);
    const ticket = await page.locator('.ticket').boundingBox();
    const report = await page.locator('.scouting').boundingBox();
    expect(report.y).toBeGreaterThanOrEqual(ticket.y + ticket.height);
    expect(report.y - (ticket.y + ticket.height)).toBeLessThanOrEqual(48);
    expect(Math.abs(ticket.width - report.width)).toBeLessThanOrEqual(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1280);
  });
}
