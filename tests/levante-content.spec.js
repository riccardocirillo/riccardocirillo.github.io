import { test, expect } from '@playwright/test';

// Finishing pass of 07/11/2026: 2 weeks, international team, no grade, ~3 h as a target, personas explained.
for (const [path, weeks, team, sentence] of [
  ['/levante/', '2 weeks', 'international team of 6', 'AI-generated'],
  ['/es/levante/', '2 semanas', 'equipo internacional de 6', 'generados con IA'],
  ['/it/levante/', '2 settimane', 'team internazionale di 6', 'generati con IA'],
]) {
  test(`${path}: duration, team, no grade, no "one week", personas explained`, async ({ page }) => {
    await page.goto(path);
    const main = page.locator('main');
    await expect(page.locator('.score-strip')).toContainText(team);
    await expect(page.locator('.scorecard')).toContainText(weeks);
    await expect(main).not.toContainText(/9\/10|1 week|one week|one-week|una semana|una settimana/i);
    expect(await page.locator('meta[name="description"]').getAttribute('content')).not.toContain('9/10');
    await expect(page.locator('section#research h3, section[id] h3').filter({ hasText: 'Personas' })).toBeVisible();
    await expect(main).toContainText(sentence);
    await expect(page.locator('figure:has(img[src$="persona-gabriela.webp"]) figcaption')).toBeVisible();
    await expect(page.locator('figure.case-video figcaption')).toContainText('Tidewatch');
  });
}

test('no grade on the title screen or the game', async ({ page }) => {
  for (const path of ['/', '/es/', '/it/', '/play/#levante']) {
    await page.goto(path);
    await expect(page.locator('body')).not.toContainText('9/10');
  }
});
