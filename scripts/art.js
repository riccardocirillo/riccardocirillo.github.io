// All the pixel art of the site, drawn in code (no external assets, no photos):
//   npm run art → public/game/field.png, night.png (F6), icons.png, title.svg
//                 and the placeholder cover public/assets/sensor-lab/cover.webp (scripts/art/sensor-lab-cover.js)
// Every colour comes from src/palette.js. Edit the files in scripts/art/ and run again.
// v4: the characters (runner, coach, pitcher, mates, fans) are hand-drawn grids in art/sprites/*.txt, written by
// scripts/art/grid.js (runs after this file, same command). The old generators runner.js and crew.js are in scripts/_archive/.
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { field, night } from './art/field.js';
import { sensorLabCover } from './art/sensor-lab-cover.js';
import { icons } from './art/icons.js';
import { title } from './art/title.js';

const dir = new URL('../public/game/', import.meta.url);
const out = (name) => fileURLToPath(new URL(name, dir));

await mkdir(dir, { recursive: true });
await Promise.all([field(out), night(out), icons(out), title(out), sensorLabCover()]);
console.log('✓ public/game: field.png, night.png, icons.png, title.svg · public/assets/sensor-lab/cover.webp');
