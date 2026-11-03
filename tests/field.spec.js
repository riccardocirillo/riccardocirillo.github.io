import { test, expect } from '@playwright/test';
import { STOPS, FIELD, WORLD, CORE, APRON } from '../src/field-map.js';

// v4 fix1 (docs/ART_BIBLE.md § 7): with JS the game fills the screen and the CORE of the stadium (640×360, lamps to the
// dugout) is always whole on screen, under the HUD. Scale = the largest whole number with which the core fits (phones held
// upright: 2×); under 2× (and wherever the apron would leave a gap) a fractional scale in 1/48 steps. The apron (the
// stadium drawn on around the world) covers the rest of the screen: never a gap. Same rule as fit() in src/game.js.
export function scaleFor(w, h, hud) {
  const room = h - hud;
  const most = h > w * 1.2 ? Math.min(2, room / CORE.h) : Math.min(w / CORE.w, room / CORE.h);
  const cover = Math.max(w / (WORLD.width + 2 * APRON.x), h / (WORLD.height + 2 * APRON.y));
  let s = most >= 2 ? Math.floor(most) : Math.floor(most * 48) / 48;
  if (s < cover) s = Math.ceil(cover * 48) / 48;
  return s;
}
const sizes = [[1280, 800], [1280, 720], [1440, 900], [1470, 956], [1536, 730], [1920, 1080], [2560, 1080], [1000, 800], [999, 800], [800, 700], [520, 800], [390, 844], [320, 640], [844, 390], [1024, 768]];
const near = (a, b) => Math.abs(a - b) < 0.6;

for (const [width, height] of sizes) {
  test.describe(`world @ ${width}×${height}`, () => {
    test.use({ viewport: { width, height } });

    test('the core is whole under the HUD (upright phones: its whole height), the apron covers the screen, no page scroll', async ({ page }) => {
      await page.goto('/play/');
      const hud = (await page.locator('.hud').boundingBox()).height;
      const scale = scaleFor(width, height, hud);
      expect(Number(await page.locator('.field').evaluate((el) => getComputedStyle(el).getPropertyValue('--fs')))).toBeCloseTo(scale, 5);
      if (scale >= 2) expect(Number.isInteger(scale)).toBe(true); // whole numbers from 2× up
      const field = await page.locator('.layer-field').boundingBox();
      expect(near(field.width, WORLD.width * scale) && near(field.height, WORLD.height * scale)).toBe(true);
      expect(Number.isInteger(field.x) && Number.isInteger(field.y)).toBe(true); // the camera moves by whole pixels
      const core = { x: field.x + CORE.x * scale, y: field.y + CORE.y * scale, w: CORE.w * scale, h: CORE.h * scale };
      const upright = height > width * 1.2;
      if (!upright) {
        expect(core.x).toBeGreaterThanOrEqual(-0.5);
        expect(core.x + core.w).toBeLessThanOrEqual(width + 0.5);
      }
      expect(core.y).toBeGreaterThanOrEqual(hud - 0.5);
      expect(core.y + core.h).toBeLessThanOrEqual(height + 0.5);
      const apron = await page.locator('.apron').boundingBox(); // never a gap
      expect(apron.x).toBeLessThanOrEqual(0);
      expect(apron.y).toBeLessThanOrEqual(0);
      expect(apron.x + apron.width).toBeGreaterThanOrEqual(width);
      expect(apron.y + apron.height).toBeGreaterThanOrEqual(height);
      const runner = await page.locator('.runner').boundingBox();
      expect(near(runner.width, 48 * scale)).toBe(true); // 48 px cells at the same scale
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
