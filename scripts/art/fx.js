// The effects of v4 (docs/ART_BIBLE.md § 5): small sheets drawn in code, palette colours only, no random noise.
//   fireworks.png  8 frames of 32×32: a rocket, the burst opening in rings of 2×2 sparks, the sparks falling and going out
//   dust.png       3 frames of 12×8: the puff of dust at the runner's feet
//   spark.png      2 frames of 12×12: the star of a high five
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { PALETTE } from '../../src/palette.js';

const hex = (name) => [1, 3, 5].map((i) => parseInt(PALETTE[name].slice(i, i + 2), 16));

function sheet(cw, ch, frames) {
  const w = cw * frames, data = Buffer.alloc(w * ch * 4);
  const set = (f, x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < cw && y < ch) data.set([...hex(c), 255], (y * w + f * cw + x) * 4); };
  const png = (file) => sharp(data, { raw: { width: w, height: ch, channels: 4 } }).png({ palette: true, colours: 16, quality: 100, dither: 0, compressionLevel: 9 }).toFile(file);
  return { set, png };
}

export async function fx(out) {
  // fireworks: 12 rays; radius grows, then the sparks drop and dim (yellow → red → redDeep)
  const fw = sheet(32, 32, 8);
  const c = 16;
  fw.set(0, c, 26, 'white'); fw.set(0, c, 27, 'yellow'); fw.set(0, c, 28, 'redLight'); // rocket
  fw.set(1, c, 14, 'white'); fw.set(1, c, 15, 'yellow'); fw.set(1, c - 1, 15, 'yellow'); fw.set(1, c, 16, 'yellow'); fw.set(1, c + 1, 15, 'yellow');
  const steps = [[2, 4, 'white'], [3, 7, 'yellow'], [4, 10, 'yellow'], [5, 12, 'redLight'], [6, 13, 'red'], [7, 14, 'redDeep']];
  for (const [f, r, colour] of steps) {
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      const drop = f >= 5 ? (f - 4) * 2 : 0;
      const x = c + Math.cos(a) * r, y = c + Math.sin(a) * r + drop;
      fw.set(f, x, y, colour); fw.set(f, x + 1, y, colour); fw.set(f, x, y + 1, colour); fw.set(f, x + 1, y + 1, colour);
      if (f <= 4) fw.set(f, c + Math.cos(a) * (r - 2), c + Math.sin(a) * (r - 2), f === 2 ? 'skyLight' : 'yellow');
    }
  }
  await fw.png(out('fireworks.png'));

  // dust: a low puff that grows and thins (dirt colours, lit from the top left)
  const dust = sheet(12, 8, 3);
  const puffs = [[[3, 6], [4, 6], [3, 5], [5, 6]], [[2, 5], [3, 5], [5, 4], [6, 5], [4, 6], [7, 6], [2, 6]], [[1, 4], [5, 3], [8, 4], [9, 5], [2, 6]]];
  puffs.forEach((dots, f) => dots.forEach(([x, y], i) => { dust.set(f, x, y, i % 2 ? 'dirt' : 'dirtLight'); dust.set(f, x + 1, y, 'dirt'); }));
  await dust.png(out('dust.png'));

  // spark: a 4-point star, then a smaller one
  const spark = sheet(12, 12, 2);
  for (let i = -5; i <= 5; i++) { spark.set(0, 6 + i, 6, Math.abs(i) < 3 ? 'white' : 'yellow'); spark.set(0, 6, 6 + i, Math.abs(i) < 3 ? 'white' : 'yellow'); }
  for (const [x, y] of [[4, 4], [8, 4], [4, 8], [8, 8]]) spark.set(0, x, y, 'yellow');
  for (let i = -3; i <= 3; i++) { spark.set(1, 6 + i, 6, i ? 'yellow' : 'white'); spark.set(1, 6, 6 + i, i ? 'yellow' : 'white'); }
  await spark.png(out('spark.png'));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await fx((name) => fileURLToPath(new URL(`../../public/game/${name}`, import.meta.url)));
  console.log('✓ fireworks.png, dust.png, spark.png');
}
