import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';
import { PALETTE, RAMPS } from '../src/palette.js';

// The pixel art in public/game/ (made by `npm run art`) must follow the rules of B4.
const allowed = new Set(Object.values(PALETTE));
const hex = (r, g, b) => `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;

async function colours(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const found = new Set();
  for (let i = 0; i < data.length; i += 4) if (data[i + 3] > 0) found.add(hex(data[i], data[i + 1], data[i + 2]));
  return { found, info };
}

test('palette has exactly 34 colours (16 + 8 for the 480×270 art + 10 for the F6 ramps and the night sky)', () => {
  expect(allowed.size).toBe(34);
});

// F6: four ramps of 5 tones, darkest first, with the exact colours of the plan (docs/PROMPT_V3.md).
// The plan also says "max 20° of hue per step", but its own colours move more (red 328°→3°, grass 164°→122°): the exact
// colours win, so the test checks the order and the values, not the hue steps (DECISIONS.md, F6).
const lum = (hexColor) => [1, 3, 5].reduce((sum, i, k) => sum + parseInt(hexColor.slice(i, i + 2), 16) * [0.2126, 0.7152, 0.0722][k], 0);
test('F6 ramps: red, navy, grass and skin have 5 tones each, from dark to light', () => {
  expect(Object.keys(RAMPS)).toEqual(['red', 'navy', 'grass', 'skin']);
  for (const [name, ramp] of Object.entries(RAMPS)) {
    expect(ramp, name).toHaveLength(5);
    const hexes = ramp.map((tone) => PALETTE[tone]);
    for (let i = 1; i < 5; i++) expect(lum(hexes[i]), `${name} ${i}`).toBeGreaterThan(lum(hexes[i - 1]));
  }
  expect(RAMPS.red.map((t) => PALETTE[t])).toEqual(['#5a1238', '#8a1c16', '#b3261e', '#e0533f', '#f5925a']);
  expect(RAMPS.navy.map((t) => PALETTE[t])).toEqual(['#0f1a30', '#1b2a4a', '#2c4170', '#4a6aa0', '#8fb0d8']);
  expect(RAMPS.grass.map((t) => PALETTE[t])).toEqual(['#1f5a4a', '#2f7d32', '#3f9b3a', '#5db648', '#a8d65a']);
  expect(RAMPS.skin.map((t) => PALETTE[t])).toEqual(['#5e3a3a', '#a8704f', '#d9a07a', '#eebd92', '#f8dcb4']);
});

test('F6 selective outline: the edge of the runner uses several ramp tones, never one flat dark colour', async () => {
  const { data, info } = await sharp('public/game/runner.png').ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const edge = new Set();
  const opaque = (x, y) => x >= 0 && y >= 0 && x < info.width && y < info.height && data[(y * info.width + x) * 4 + 3] > 0;
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
    if (!opaque(x, y)) continue;
    if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !opaque(x + dx, y + dy))) {
      const i = (y * info.width + x) * 4;
      edge.add(hex(data[i], data[i + 1], data[i + 2]));
    }
  }
  expect(edge.size).toBeGreaterThanOrEqual(6);
  expect(edge.has('#000000')).toBe(false);
});

for (const [file, size] of [['field.png', [480, 270]], ['night.png', [480, 270]], ['runner.png', [864, 144]], ['crew.png', [384, 192]], ['icons.png', [168, 24]]]) {
  test(`${file}: ${size.join('×')} and only palette colours`, async () => {
    const { found, info } = await colours(`public/game/${file}`);
    expect([info.width, info.height]).toEqual(size);
    expect([...found].filter((c) => !allowed.has(c))).toEqual([]);
  });
}

test('Sensor lab placeholder cover: 640×480 (160×120 at 4×), original, only palette colours', async () => {
  const { found, info } = await colours('public/assets/sensor-lab/cover.webp');
  expect([info.width, info.height]).toEqual([640, 480]);
  expect([...found].filter((c) => !allowed.has(c))).toEqual([]);
  // pixel art at 4×: every 4×4 block is one colour, so the image has at most 160×120 distinct cells
  const { data } = await sharp('public/assets/sensor-lab/cover.webp').ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (const [x, y] of [[3, 3], [100, 77], [401, 250], [637, 477]]) {
    const at = (px, py) => data.subarray((py * 640 + px) * 4, (py * 640 + px) * 4 + 4).join();
    const bx = x - (x % 4), by = y - (y % 4);
    expect(at(bx + 3, by + 3)).toBe(at(bx, by));
  }
});

test('runner.json describes 18 frames of 48×48: idle (4), blink, run, swing (4), high five, cheer, wave', async () => {
  const sheet = JSON.parse(await readFile('public/game/runner.json', 'utf8'));
  expect(sheet.frames).toHaveLength(18);
  expect(sheet.frames.every((f) => f.frame.w === 48 && f.frame.h === 48)).toBe(true);
  expect(sheet.meta.size).toEqual({ w: 864, h: 144 });
  expect(sheet.meta.frameTags.map((t) => [t.name, t.from, t.to])).toEqual([
    ['idle', 0, 3], ['blink', 4, 4], ['run', 5, 8], ['swing', 9, 12], ['highfive', 13, 13], ['cheer', 14, 15], ['wave', 16, 17],
  ]);
});

test('night.png: same size as field.png, the sky is the night of the page, the towers are lit', async () => {
  const { data } = await sharp('public/game/night.png').ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const at = (x, y) => hex(...data.subarray((y * 480 + x) * 4, (y * 480 + x) * 4 + 3));
  expect([at(150, 12), at(151, 12)]).toContain('#0b0f1e'); // sky (dithered with navyDark near the stands)
  expect(at(37, 2)).toBe(PALETTE.yellow); // a lamp of the left tower
  const day = await sharp('public/game/field.png').metadata();
  expect([day.width, day.height]).toEqual([480, 270]);
});

test('PNG weight: every sheet stays light', async () => {
  for (const [file, max] of [['field.png', 40_000], ['night.png', 40_000], ['runner.png', 25_000], ['crew.png', 15_000]]) {
    expect((await sharp(`public/game/${file}`).toBuffer()).length, file).toBeLessThan(max);
  }
});

test('crew.json describes 8 frames of 48×48: idle, high five, cheer, pitch', async () => {
  const sheet = JSON.parse(await readFile('public/game/crew.json', 'utf8'));
  expect(sheet.frames).toHaveLength(8);
  expect(sheet.frames.every((f) => f.frame.w === 48 && f.frame.h === 48)).toBe(true);
  expect(sheet.meta.size).toEqual({ w: 384, h: 192 });
  expect(sheet.meta.frameTags.map((t) => [t.name, t.from, t.to])).toEqual([['idle', 0, 1], ['highfive', 2, 2], ['cheer', 3, 4], ['pitch', 5, 7]]);
});

test('title.svg uses only palette colours', async () => {
  const svg = await readFile('public/game/title.svg', 'utf8');
  const fills = [...svg.matchAll(/fill="(#[0-9a-f]{6})"/g)].map((m) => m[1]);
  expect(fills.length).toBeGreaterThan(0);
  expect(fills.filter((c) => !allowed.has(c))).toEqual([]);
});

// --- v4: hand-drawn grids (docs/ART_BIBLE.md § 1) -----------------------------------------------------------------
// Every sheet of art/sprites/*.txt is checked on the grid itself (isolated pixels, jitter) and on its PNG (palette, weight).
import { existsSync } from 'node:fs';
import { loadSheet, sheetNames } from '../scripts/art/grid.js';
import { parseSheet, variantRows } from '../scripts/art/grid-parse.js';

const names = await sheetNames();
const neighbours = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];

// A pixel with no neighbour (8 around it) of the same colour, unless its character is marked `!` in the legend.
function isolated(sheet, rows) {
  const out = [];
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch === '.' || sheet.alone.has(ch)) return;
    const colour = sheet.legend[ch];
    if (!neighbours.some(([dx, dy]) => sheet.legend[rows[y + dy]?.[x + dx]] === colour)) out.push(`${x},${y}`);
  }));
  return out;
}
const changed = (a, b) => a.reduce((sum, row, y) => sum + [...row].filter((ch, x) => ch !== b[y][x]).length, 0);

test('v4 grids: the palette has no pure black (outlines are never #000)', () => {
  expect(allowed.has('#000000')).toBe(false);
});

test('v4 grids: the reader stops with file:line on mistakes', () => {
  const head = 'size: 2x2\npalette:\n  1 navy\ntags:\n  a 0-0\n';
  expect(() => parseSheet(`${head}--- a 0 100\n11\n1\n`, 'x.txt')).toThrow('x.txt:8: row has 1 characters, expected 2');
  expect(() => parseSheet(`${head}--- a 0 100\n11\n1Z\n`, 'x.txt')).toThrow('x.txt:8: character "Z" is not in the palette legend');
  expect(() => parseSheet(`${head}--- a 0\n11\n11\n`, 'x.txt')).toThrow('x.txt:6: frame a 0 has no duration (ms)');
  expect(() => parseSheet(head.replace('a 0-0', 'a 0-1') + '--- a 0 100\n11\n11\n', 'x.txt')).toThrow('x.txt:5: tag a needs frame 1 (column 1): missing');
  expect(() => parseSheet('size: 1x1\npalette:\n  1 navyy\n', 'x.txt')).toThrow('x.txt:3: colour "navyy" is not in src/palette.js');
});

test('v4 grids: proof of the method (the art bible target, converted 1:1) reads as one 48×48 frame with a duration', async () => {
  const proof = await loadSheet('art/proof/batter_idle0.txt');
  expect(proof.size).toEqual({ w: 48, h: 48 });
  expect(proof.frames).toHaveLength(1);
  expect(proof.frames[0].ms).toBeGreaterThan(0);
});

for (const name of names) {
  test(`v4 grid ${name}: PNG + JSON match the grid, only palette colours, every frame has a duration`, async () => {
    const sheet = await loadSheet(name);
    const json = JSON.parse(await readFile(`public/game/${name}.json`, 'utf8'));
    const { found, info } = await colours(`public/game/${name}.png`);
    expect([info.width, info.height]).toEqual([sheet.size.w * sheet.frames.length, sheet.size.h * sheet.variants.length]);
    expect(json.meta.size).toEqual({ w: info.width, h: info.height });
    expect([...found].filter((c) => !allowed.has(c))).toEqual([]);
    expect(json.frames).toHaveLength(sheet.frames.length);
    for (const f of json.frames) expect(f.duration, f.filename).toBeGreaterThan(0);
  });

  test(`v4 grid ${name}: no isolated pixels (except the characters marked ! for eyes and glints)`, async () => {
    const sheet = await loadSheet(name);
    for (const variant of sheet.variants) for (const frame of sheet.frames) {
      expect(isolated(sheet, variantRows(sheet, frame, variant)), `${variant.name} ${frame.tag} ${frame.n}`).toEqual([]);
    }
  });

  test(`v4 grid ${name}: no jitter (pixels changed between frames of a tag stay under the tag's limit)`, async () => {
    const sheet = await loadSheet(name);
    for (const tag of sheet.tags) {
      if (tag.to === tag.from) continue;
      expect(tag.jitter, `${tag.name} needs jitter=`).not.toBeNull();
      for (let i = tag.from + 1; i <= tag.to; i++) {
        expect(changed(sheet.frames[i - 1].rows, sheet.frames[i].rows), `${tag.name} ${i - tag.from - 1}→${i - tag.from}`).toBeLessThanOrEqual(tag.jitter);
      }
    }
  });
}

test('v4: every picture of the game stays under 400 KB (§ 13)', async () => {
  const { readdir } = await import('node:fs/promises');
  for (const file of (await readdir('public/game')).filter((f) => f.endsWith('.png'))) {
    expect((await readFile(`public/game/${file}`)).length, file).toBeLessThan(400_000);
  }
});

test('v4: /art-lab/ and the archive of old sprites are not in the build', () => {
  expect(existsSync('dist/index.html')).toBe(true);
  expect(existsSync('dist/art-lab')).toBe(false);
  expect(existsSync('dist/_archive')).toBe(false);
});
