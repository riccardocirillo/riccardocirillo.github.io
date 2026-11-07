import { test, expect } from '@playwright/test';

// Levante, Prototype: the dashboard is a looping video (the buoy image stays). Chromium of the tests has no H.264: it checks
// the markup and when play() is called; the real playback is for a browser with the codec.
for (const path of ['/levante/', '/es/levante/', '/it/levante/']) {
  test(`${path}: looping muted video in place of the screenshot, buoy kept, nothing downloaded before it is in view`, async ({ page, request }) => {
    const asked = [];
    page.on('request', (r) => { if (r.url().endsWith('.mp4')) asked.push(r.url()); });
    await page.goto(path, { waitUntil: 'load' });
    const video = page.locator('figure.case-video video');
    await expect(video).toHaveCount(1);
    await expect(video).toHaveJSProperty('loop', true);
    await expect(video).toHaveJSProperty('muted', true);
    await expect(video).toHaveAttribute('aria-label', /Tidewatch/);
    await expect(video).toHaveAttribute('poster', '/assets/levante/dashboard-poster.webp');
    await expect(page.locator('figure img[src$="/dashboard.webp"]')).toHaveCount(0);
    await expect(page.locator('figure img[src$="/buoy-0.webp"]')).toHaveCount(1);
    expect(asked).toEqual([]);
    const res = await request.get('/assets/levante/dashboard.mp4');
    expect(res.status()).toBe(200);
    expect((await res.body()).length).toBeLessThan(1_000_000);
    expect((await request.get('/assets/levante/dashboard-poster.webp')).status()).toBe(200);
  });
}

const spyOnPlay = (page) => page.addInitScript(() => {
  window.plays = 0;
  HTMLMediaElement.prototype.play = function play() { window.plays += 1; return Promise.resolve(); };
});

test('it starts once, when it comes into view', async ({ page }) => {
  await spyOnPlay(page);
  await page.goto('/levante/');
  expect(await page.evaluate(() => window.plays)).toBe(0);
  await page.locator('figure.case-video video').scrollIntoViewIfNeeded();
  await expect.poll(() => page.evaluate(() => window.plays)).toBe(1);
  await page.evaluate(() => scrollTo(0, 0));
  await page.locator('figure.case-video video').scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => window.plays)).toBe(1);
});

test('with reduced motion it stays on the poster', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await spyOnPlay(page);
  await page.goto('/levante/');
  await page.locator('figure.case-video video').scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => window.plays)).toBe(0);
});

test('with the data saver on it stays on the poster', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'connection', { value: { saveData: true } }));
  await spyOnPlay(page);
  await page.goto('/levante/');
  await page.locator('figure.case-video video').scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => window.plays)).toBe(0);
});

test('in the reader of the game it starts too', async ({ page }) => {
  await spyOnPlay(page);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/play/#levante');
  await page.locator('#field-panel').getByRole('link', { name: /Read/i }).click();
  const video = page.locator('dialog.reader figure.case-video video');
  await video.scrollIntoViewIfNeeded();
  await expect.poll(() => page.evaluate(() => window.plays)).toBe(1);
});
