// All the pixel art of the site, drawn in code (no external assets, no photos):
//   npm run art → public/game/icons.png, title.svg, the night stadium in layers (v4, scripts/art/stadium.js), the effects
//                 (scripts/art/fx.js). The day field and the F6 night field (field.js) are in scripts/_archive/.
//                 and the placeholder cover public/assets/sensor-lab/cover.webp (scripts/art/sensor-lab-cover.js)
// Every colour comes from src/palette.js. Edit the files in scripts/art/ and run again.
// v4: the characters (runner, coach, pitcher, mates, fans) are hand-drawn grids in art/sprites/*.txt, written by
// scripts/art/grid.js (runs after this file, same command). The old generators runner.js and crew.js are in scripts/_archive/.
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { sensorLabCover } from './art/sensor-lab-cover.js';
import { icons } from './art/icons.js';
import { title } from './art/title.js';
import { stadium } from './art/stadium.js';
import { fx } from './art/fx.js';

const dir = new URL('../public/game/', import.meta.url);
const out = (name) => fileURLToPath(new URL(name, dir));

await mkdir(dir, { recursive: true });
await Promise.all([icons(out), title(out), sensorLabCover(), fx(out)]);
await stadium(out); // after the grids exist: it reads fans.txt (run `npm run art` twice after a change to fans.txt)
console.log('✓ public/game: icons.png, title.svg, stadium layers, fireworks/dust/spark · public/assets/sensor-lab/cover.webp');
