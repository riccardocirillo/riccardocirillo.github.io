// Writes the hand-drawn grids of art/sprites/ as PNG + JSON (the format is described in scripts/art/grid-parse.js).
//   npm run art → public/game/<sheet>.png + <sheet>.json for every art/sprites/<sheet>.txt
import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { PALETTE } from '../../src/palette.js';
import { parseSheet, variantRows, sheetJson, GridError } from './grid-parse.js';

const ROOT = new URL('../../', import.meta.url);
export const SPRITES = fileURLToPath(new URL('art/sprites/', ROOT));
export { parseSheet, variantRows, sheetJson };

const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

// RGBA pixels of the whole sheet: one column per frame, one row per variant.
export function render(sheet) {
  const { w, h } = sheet.size;
  const width = w * sheet.frames.length, height = h * sheet.variants.length;
  const data = Buffer.alloc(width * height * 4);
  sheet.variants.forEach((variant, vy) => sheet.frames.forEach((frame, fx) => {
    variantRows(sheet, frame, variant).forEach((row, y) => [...row].forEach((ch, x) => {
      const name = sheet.legend[ch];
      if (!name) return;
      const i = ((vy * h + y) * width + fx * w + x) * 4;
      data.set([...rgb(PALETTE[name]), 255], i);
    }));
  }));
  return { data, width, height };
}

// `name` = a sheet of art/sprites/, or a path from the repo root ending in .txt (e.g. art/proof/batter_idle0.txt).
export async function loadSheet(name) {
  const file = name.endsWith('.txt') ? name : `art/sprites/${name}.txt`;
  return parseSheet(await readFile(new URL(file, ROOT), 'utf8'), file);
}

export async function writeSheet(name, outDir) {
  const sheet = await loadSheet(name);
  const { data, width, height } = render(sheet);
  await mkdir(outDir, { recursive: true });
  await sharp(data, { raw: { width, height, channels: 4 } }).png({ palette: true, colours: 256, quality: 100, effort: 10, dither: 0, compressionLevel: 9 }).toFile(`${outDir}/${name}.png`);
  await writeFile(`${outDir}/${name}.json`, `${JSON.stringify(sheetJson(sheet, name), null, 1)}\n`);
  return sheet;
}

export async function sheetNames() {
  return (await readdir(SPRITES).catch(() => [])).filter((f) => f.endsWith('.txt')).map((f) => f.slice(0, -4)).sort();
}

// Run directly: node scripts/art/grid.js → every sheet of art/sprites/ into public/game/
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const out = fileURLToPath(new URL('public/game', ROOT));
  try {
    const names = await sheetNames();
    for (const name of names) await writeSheet(name, out);
    console.log(`✓ grids (art/sprites): ${names.map((n) => `${n}.png`).join(', ') || 'none yet'}`);
  } catch (error) {
    if (error instanceof GridError) { console.error(`✗ ${error.message}`); process.exit(1); }
    throw error;
  }
}
