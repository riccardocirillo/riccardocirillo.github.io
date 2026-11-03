import { test, expect } from '@playwright/test';
import sharp from 'sharp';
import { WORLD, CORE, TOWERS, SCOREBOARD, STOPS, DUGOUT, ON_DECK, CREW } from '../src/field-map.js';

// fix1 (after Riccardo tried v4): 1 the title screen grows with the screen, 2 the whole stadium is in view when the game
// starts, 3 the runner waits fully in view in front of the dugout while the uniform is chosen.

const overlap = (a, b) => !(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y);
const inside = (box, w, h, top = 0) => box.x >= -0.5 && box.y >= top - 0.5 && box.x + box.width <= w + 0.5 && box.y + box.height <= h + 0.5;

// --- 1 · Title screen -----------------------------------------------------------------------------------------------
test.describe('fix1 · title screen', () => {
  const sizes = [[1280, 720], [1366, 768], [1440, 900], [1920, 1080], [2560, 1440], [3840, 2160]];
  let last = 0;
  for (const [width, height] of sizes) {
    test(`@ ${width}×${height}: the name grows with the screen, the block is 60–90% wide, the first screen holds what it must`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/');
      const name = parseFloat(await page.locator('.logo').evaluate((el) => getComputedStyle(el).fontSize));
      expect(name).toBeGreaterThanOrEqual(last);
      last = name;
      const grid = await page.locator('.title-grid').boundingBox();
      expect(grid.width / width).toBeGreaterThanOrEqual(0.6);
      expect(grid.width / width).toBeLessThanOrEqual(0.9);
      expect(Math.abs(grid.x + grid.width / 2 - width / 2)).toBeLessThan(2); // centred
      // name, role and dates, CV, the menu and Nipotyno always; from 768 px high all three Quick picks
      const must = ['.logo', '.role', '.cv-top', '.menu-item >> nth=2', '.pick >> nth=0'];
      if (height >= 768) must.push('.pick >> nth=2');
      for (const sel of must) expect((await page.locator(sel).boundingBox()).y + (await page.locator(sel).boundingBox()).height, sel).toBeLessThanOrEqual(height);
      // the menu items: all as wide as each other, at least 9vh (min 56 px) high; every target ≥ 44 px
      const items = await Promise.all((await page.locator('.menu-item').all()).map((el) => el.boundingBox()));
      for (const box of items) {
        expect(box.width).toBeCloseTo(items[0].width, 0);
        expect(box.height).toBeGreaterThanOrEqual(Math.max(56, height * 0.09) - 0.5);
      }
      for (const el of await page.locator('.title-bar a, .pick').all()) expect((await el.boundingBox()).height).toBeGreaterThanOrEqual(44);
    });
  }

  test('the 4K screen: the stadium behind still covers the whole title screen', async ({ page }) => {
    await page.setViewportSize({ width: 3840, height: 2160 });
    await page.goto('/');
    const box = await page.locator('.title-stadium').boundingBox();
    const screen = await page.locator('.title-screen').boundingBox();
    expect(box.x).toBeLessThanOrEqual(0);
    expect(box.x + box.width).toBeGreaterThanOrEqual(3840);
    expect(box.y).toBeLessThanOrEqual(screen.y);
  });

  test('phone (390×844): the same sizes as before (16 px text, the name 4 Jersey steps), nothing scrolls sideways', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    expect(await page.locator('.title-screen').evaluate((el) => getComputedStyle(el).fontSize)).toBe('16px');
    expect(parseFloat(await page.locator('.logo').evaluate((el) => getComputedStyle(el).fontSize))).toBeCloseTo(16 * 1.1667 * 4, 0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });

  test('browser zoom still makes the text bigger (WCAG 1.4.4: the size has a rem part)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    const before = parseFloat(await page.locator('.menu-desc >> nth=0').evaluate((el) => getComputedStyle(el).fontSize));
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; }); // the visitor's text size
    const after = parseFloat(await page.locator('.menu-desc >> nth=0').evaluate((el) => getComputedStyle(el).fontSize));
    expect(after).toBeGreaterThan(before * 1.5);
  });
});

// --- 2 · The whole stadium in view ----------------------------------------------------------------------------------
// World points → screen boxes, through the box of the field layer (it is the world at the scale on screen).
async function worldBox(page) {
  const field = await page.locator('.layer-field').boundingBox();
  const s = field.width / WORLD.width;
  return { s, at: (x, y, w, h) => ({ x: field.x + x * s, y: field.y + y * s, width: w * s, height: h * s }) };
}

const desk = [[1280, 720], [1280, 800], [1470, 956], [1440, 900], [1920, 1080], [2560, 1080], [1024, 768], [844, 390]];
for (const [width, height] of desk) {
  test(`fix1 · game @ ${width}×${height}: at the start the lamps, scoreboard, stands, home plate and dugout are all on screen, under the HUD`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/play/');
    const hud = (await page.locator('.hud').boundingBox()).height;
    const { at } = await worldBox(page);
    const home = STOPS.find((s) => s.id === 'home');
    const things = {
      ...Object.fromEntries(TOWERS.map((t, i) => [`lamp ${i + 1}`, at(t.x - 2, t.y, 19, 10)])),
      scoreboard: at(SCOREBOARD.x, SCOREBOARD.y, SCOREBOARD.w, SCOREBOARD.h),
      stands: at(CORE.x, 112, CORE.w, 50),
      'home plate': at(home.x - 8, home.y - 8, 16, 12),
      dugout: at(DUGOUT.x - 72, DUGOUT.y - 40, 144, 37),
    };
    for (const [name, box] of Object.entries(things)) expect(inside(box, width, height, hud), name).toBe(true);
    // no empty zone: the drawn stadium (apron) reaches every edge
    const apron = await page.locator('.apron').boundingBox();
    expect(apron.x <= 0 && apron.y <= 0 && apron.x + apron.width >= width && apron.y + apron.height >= height).toBe(true);
  });
}

test('fix1 · game @ 390×844 (upright): 2×, the lamps and home plate on screen together, the whole height of the stadium', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/play/');
  const hud = (await page.locator('.hud').boundingBox()).height;
  const { s, at } = await worldBox(page);
  expect(s).toBe(2);
  const home = STOPS.find((p) => p.id === 'home');
  expect(inside(at(home.x - 8, home.y - 8, 16, 12), 390, 844, hud), 'home plate').toBe(true);
  expect(TOWERS.some((t) => inside(at(t.x - 2, t.y, 19, 10), 390, 844, hud)), 'a lamp').toBe(true);
  const core = at(CORE.x, CORE.y, CORE.w, CORE.h);
  expect(core.y).toBeGreaterThanOrEqual(hud - 0.5);
  expect(core.y + core.height).toBeLessThanOrEqual(844.5);
});

test('fix1 · the camera on a wide screen does not follow the runner: the stadium stays where it is while he walks', async ({ page }) => {
  await page.setViewportSize({ width: 1470, height: 956 });
  await page.goto('/play/');
  const before = await page.locator('.layer-field').boundingBox();
  await page.getByRole('button', { name: /^Skip/ }).click();
  await page.waitForTimeout(600);
  expect(await page.locator('.layer-field').boundingBox()).toEqual(before);
});

// --- 3 · The runner on deck, in front of the dugout -----------------------------------------------------------------
for (const [width, height] of [...desk, [390, 844]]) {
  test(`fix1 · choosing the uniform @ ${width}×${height}: the runner is whole on screen, clear of the roof, the teammates and the bar`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/play/');
    await expect(page.locator('.uniform-pick')).toBeVisible();
    const runner = await page.locator('.runner').boundingBox();
    expect(inside(runner, width, height), 'on screen').toBe(true);
    expect(overlap(runner, await page.locator('.layer-roof').boundingBox()), 'roof').toBe(false);
    const bar = await page.locator('.game-bar').boundingBox();
    expect(overlap(runner, bar), 'bar').toBe(false);
    for (const id of ['mateA', 'mateB', 'mateC']) {
      const mate = await page.locator(`[data-crew="${id}"]`).boundingBox();
      expect(overlap(runner, mate), id).toBe(false);
      expect(overlap(mate, bar), `bar over ${id}`).toBe(false);
    }
  });
}

test('fix1 · on deck: hovering a uniform dresses the runner there, choosing one sends him to home plate', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/play/');
  const row = () => page.locator('.field').evaluate((el) => el.style.getPropertyValue('--uniform-row'));
  expect(await row()).toBe('0');
  await page.locator('[data-uniform="designer"]').hover();
  expect(await row()).toBe('1');
  await page.mouse.move(5, 300);
  expect(await row()).toBe('0'); // leaving the tiles: back to the chosen one
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('[data-uniform="maker"]').click();
  const home = STOPS.find((s) => s.id === 'home');
  await expect(page.locator('.runner')).toHaveCSS('--fy', String(home.y));
  expect(await row()).toBe('2');
});

test('fix1 · drawing order: players sorted by their feet, the roof covers only who stands behind it, shadows under everyone', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/play/');
  const z = (sel) => page.locator(sel).evaluate((el) => Number(getComputedStyle(el).zIndex));
  expect(await z('.runner')).toBe(100 + ON_DECK.y);
  for (const m of CREW) expect(await z(`[data-crew="${m.id}"]`), m.id).toBe(100 + m.y);
  expect(await z('.layer-roof')).toBe(100 + DUGOUT.y - 28);
  expect(await z('.runner')).toBeGreaterThan(await z('.layer-roof'));
  for (const el of await page.locator('.shadow').all()) expect(await el.evaluate((e) => Number(getComputedStyle(e).zIndex))).toBe(1);
  expect(await page.locator('.shadow').count()).toBe(CREW.length + 1);
  expect(await page.locator('.runner').evaluate((el) => getComputedStyle(el, '::before').content)).toBe('none');
  expect(await z('.base >> nth=0')).toBeGreaterThan(100 + WORLD.height); // the labels stay over every player
});

test('fix1 · the teammates stand still with their arms down until home plate (idle frame: nothing above the head)', async ({ page }) => {
  const { data, info } = await sharp('public/game/mates.png').raw().ensureAlpha().toBuffer({ resolveWithObject: true });
  for (let row = 0; row < 3; row++) {
    for (let y = 0; y < 10; y++) for (let x = 0; x < 48; x++) {
      expect(data[((row * 48 + y) * info.width + x) * 4 + 3], `mate ${row} pixel ${x},${y}`).toBe(0);
    }
  }
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/play/#sensor-lab'); // 3rd base: the last stop before home plate
  for (const id of ['mateA', 'mateB', 'mateC']) {
    const mate = page.locator(`[data-crew="${id}"]`);
    await expect(mate).not.toHaveClass(/is-cheer/);
    expect(await mate.evaluate((el) => getComputedStyle(el).backgroundPositionX)).toMatch(/^0(px|%)?$/);
  }
});
