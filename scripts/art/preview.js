// Preview of a grid sheet for the look-and-fix loop and the quality gates (v4): the whole sheet at N× on a background,
// then the same at 2×, then the silhouette and greys rows. Writes only where you ask (docs/assets-preview/ is private).
//   node scripts/art/preview.js <sheet> <out.png> [scale=6] [background=#2f7d32]
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { loadSheet, render } from './grid.js';

export async function preview(name, out, scale = 6, bg = '#2f7d32') {
  const sheet = await loadSheet(name);
  const { data, width, height } = render(sheet);
  const raw = (buf) => sharp(buf, { raw: { width, height, channels: 4 } });
  const silhouette = Buffer.from(data);
  const grey = Buffer.from(data);
  for (let i = 0; i < data.length; i += 4) {
    if (!data[i + 3]) continue;
    silhouette.set([27, 42, 74], i);
    const v = Math.round(0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]);
    grey.set([v, v, v], i);
  }
  const big = (buf, s) => raw(buf).resize(width * s, height * s, { kernel: 'nearest' }).png().toBuffer();
  const h = height * scale;
  const paper = await sharp({ create: { width: width * 3, height: height * 3, channels: 4, background: '#f6f2ea' } }).png().toBuffer();
  await sharp({ create: { width: Math.max(width * scale, width * 3), height: h + height * 2 + height * 6 + 24, channels: 4, background: bg } })
    .composite([
      { input: await big(data, scale), left: 0, top: 0 },
      { input: await big(data, 2), left: 0, top: h + 8 },
      { input: paper, left: 0, top: h + height * 2 + 16 },
      { input: await big(silhouette, 3), left: 0, top: h + height * 2 + 16 },
      { input: await big(grey, 3), left: 0, top: h + height * 2 + height * 3 + 24 },
    ]).png().toFile(out);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [name, out, scale = 6, bg] = process.argv.slice(2);
  await preview(name, out, +scale, bg);
  console.log(`✓ ${out}`);
}
