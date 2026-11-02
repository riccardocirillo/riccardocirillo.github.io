import { test, expect } from '@playwright/test';
import { STOPS, FIELD, WORLD } from '../src/field-map.js';

// v4 (docs/ART_BIBLE.md § 7): with JS the game fills the screen. The world (704×424) is drawn at the smallest whole-number
// scale that covers the screen (phones held upright: at least 3×), then cropped; a camera picks the part on screen.
const scaleFor = (w, h) => { const s = Math.max(Math.ceil(w / WORLD.width), Math.ceil(h / WORLD.height)); return h > w * 1.2 ? Math.max(s, 3) : s; };
const sizes = [[1280, 800], [1440, 900], [1536, 730], [1000, 800], [999, 800], [800, 700], [520, 800], [390, 844], [320, 640], [844, 390], [1024, 768]];

for (const [width, height] of sizes) {
  const scale = scaleFor(width, height);
  test.describe(`world @ ${width}×${height}`, () => {
    test.use({ viewport: { width, height } });

    test(`is drawn at ${scale}× (${WORLD.width * scale} px wide), covers the whole screen, no page scroll`, async ({ page }) => {
      await page.goto('/play/');
      await expect(page.locator('.field')).toHaveCSS('--fs', String(scale));
      const field = await page.locator('.layer-field').boundingBox();
      expect([field.width, field.height]).toEqual([WORLD.width * scale, WORLD.height * scale]);
      expect(field.x).toBeLessThanOrEqual(0);
      expect(field.y).toBeLessThanOrEqual(0);
      expect(field.x + field.width).toBeGreaterThanOrEqual(width);
      expect(field.y + field.height).toBeGreaterThanOrEqual(height);
      expect(Number.isInteger(field.x) && Number.isInteger(field.y)).toBe(true); // the camera moves by whole pixels
      const runner = await page.locator('.runner').boundingBox();
      expect([runner.width, runner.height]).toEqual([48 * scale, 48 * scale]); // 48 px cells at the same scale
      const stage = await page.locator('.stage').boundingBox();
      expect([stage.x, stage.y, stage.width, stage.height]).toEqual([0, 0, width, height]);
      expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight && document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    });
  });
}

test('every stop is inside the 640×360 picture (the 32 px margin is only there for the camera)', () => {
  for (const stop of STOPS) {
    expect(stop.x, stop.id).toBeGreaterThanOrEqual(WORLD.margin + 24);
    expect(stop.x, stop.id).toBeLessThanOrEqual(FIELD.width - WORLD.margin - 24);
    expect(stop.y, stop.id).toBeGreaterThanOrEqual(WORLD.margin + 24);
    expect(stop.y, stop.id).toBeLessThanOrEqual(FIELD.height - WORLD.margin - 24);
  }
});

for (const { width, height } of [{ width: 390, height: 844 }, { width: 320, height: 640 }, { width: 800, height: 700 }, { width: 1280, height: 800 }]) {
  test.describe(`bases @ ${width}×${height}`, () => {
    test.use({ viewport: { width, height } });

    // In every language (Fase 3): the Spanish and Italian labels are longer.
    // v4: the camera shows part of the world, so the labels must be inside the world (not always on screen).
    for (const home of ['/', '/es/', '/it/']) test(`${home}play/: every base label is completely inside the world, and no two labels overlap`, async ({ page }) => {
      await page.goto(`${home}play/`);
      const stage = await page.locator('.layer-field').boundingBox();
      const boxes = [];
      for (const base of await page.locator('.base').all()) {
        const box = await base.boundingBox();
        boxes.push([await base.getAttribute('data-stop'), box]);
        expect(box.x, `${await base.getAttribute('data-stop')} left`).toBeGreaterThanOrEqual(stage.x);
        expect(box.x + box.width, `${await base.getAttribute('data-stop')} right`).toBeLessThanOrEqual(stage.x + stage.width);
        expect(box.y, `${await base.getAttribute('data-stop')} top`).toBeGreaterThanOrEqual(stage.y);
        expect(box.y + box.height, `${await base.getAttribute('data-stop')} bottom`).toBeLessThanOrEqual(stage.y + stage.height);
      }
      for (const [i, [a, boxA]] of boxes.entries()) {
        for (const [b, boxB] of boxes.slice(i + 1)) {
          const apart = boxA.x + boxA.width <= boxB.x || boxB.x + boxB.width <= boxA.x || boxA.y + boxA.height <= boxB.y || boxB.y + boxB.height <= boxA.y;
          expect(apart, `${a} and ${b} overlap`).toBe(true);
        }
      }
    });
  });
}

test.describe('Fase 1 art in the page', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('the sprite sheets load at their real size', async ({ page, request }) => {
    await page.goto('/play/');
    for (const [file, w, h] of [['stadium-field.png', 704, 424], ['runner.png', 1728, 144], ['coach.png', 576, 96], ['pitcher.png', 288, 48], ['mates.png', 240, 144], ['icons.png', 168, 24]]) {
      const size = await page.evaluate((src) => new Promise((resolve) => { const i = new Image(); i.onload = () => resolve([i.naturalWidth, i.naturalHeight]); i.src = src; }), `/game/${file}`);
      expect(size, file).toEqual([w, h]);
    }
    expect((await request.get('/og/home.jpg')).status()).toBe(200);
  });
});
