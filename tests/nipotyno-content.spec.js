import { test, expect } from '@playwright/test';

// Finishing pass of 07/11/2026: the real prototype leads, few screens with captions, the data of the reports.
const LANGS = [
  { path: '/nipotyno/', sessions: /in the room|fully online|video call|two teammates|observers/, age: '53 to 82', over70: 'over 70', sus: '95.0 to 78.75' },
  { path: '/es/nipotyno/', sessions: /en la sala|totalmente en línea|videollamada|dos compañeros|observadores/, age: '53 a 82', over70: 'más de 70', sus: '95,0 a 78,75' },
  { path: '/it/nipotyno/', sessions: /nella stanza|interamente online|videochiamata|due compagni|osservatori/, age: '53 e gli 82', over70: 'over 70', sus: '95,0 a 78,75' },
];
for (const l of LANGS) {
  test(`${l.path}: at most 3 distinct screens, none repeated, each in the text with a caption`, async ({ page }) => {
    await page.goto(l.path);
    const srcs = await page.locator('main img').evaluateAll((imgs) => imgs.map((i) => i.getAttribute('src')));
    const screens = srcs.filter((s) => /\/(cup|pa|home)_\d+\.webp$/.test(s));
    expect(screens.length).toBeLessThanOrEqual(3);
    expect(new Set(screens).size).toBe(screens.length);
    for (const gone of ['lofi-payment', 'hifi-payment', 'pa_07', 'home_02']) expect(srcs.join()).not.toContain(gone);
    await expect(page.locator('.compare')).toHaveCount(0);
    for (const fig of await page.locator('main figure:has(img)').all()) await expect(fig.locator('figcaption')).not.toBeEmpty();
    await expect(page.locator('.key-screens figure')).toHaveCount(2);
  });

  test(`${l.path}: the numbers and wording of the reports`, async ({ page }) => {
    await page.goto(l.path);
    const test_ = page.locator('section#test');
    await expect(test_).not.toContainText(l.sessions);
    await expect(test_).toContainText(l.age);
    await expect(test_).toContainText(l.sus);
    await expect(page.locator('main')).toContainText(l.over70);
    await expect(page.locator('main')).not.toContainText(/made her feel|Una partecipante|Una participante dijo/);
  });
}

test('Key screens sit between the prototype and the Test section, buttons and captions fit at 390 px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/nipotyno/');
  const order = await page.evaluate(() => ['.proto', '.proto-data', '.key-screens', '#test'].map((s) => document.querySelector(s).getBoundingClientRect().top));
  expect(order).toEqual([...order].sort((a, b) => a - b));
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
