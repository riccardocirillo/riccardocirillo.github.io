// The only photo of the site (v4, docs/ART_BIBLE.md § 10): Riccardo's portrait for the player card.
//   npm run photo → public/assets/about/riccardo-640.webp and riccardo-320.webp (4:5, head and shoulders)
// The source docs/reference/Buonalaterale.jpg is PRIVATE (in .gitignore) and is never copied to public/.
// sharp writes no metadata unless asked (no EXIF, no GPS, no ICC profile); tests/photo.spec.js checks the copies.
import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = (path) => fileURLToPath(new URL(`../${path}`, import.meta.url));
const SOURCE = root('docs/reference/Buonalaterale.jpg');
const CROP = { left: 60, top: 100, width: 760, height: 950 }; // 4:5 on the 880×1168 source, like boards/Bust.png
export const SIZES = [[640, 800], [320, 400]];

if (!existsSync(SOURCE)) {
  console.log('· photo: docs/reference/Buonalaterale.jpg is not on this computer, the copies in public/assets/about/ stay as they are');
} else {
  await mkdir(root('public/assets/about'), { recursive: true });
  for (const [w, h] of SIZES) {
    await sharp(SOURCE).rotate().extract(CROP).resize(w, h).webp({ quality: 82, effort: 6 }).toFile(root(`public/assets/about/riccardo-${w}.webp`));
  }
  console.log('✓ public/assets/about/riccardo-640.webp, riccardo-320.webp (4:5, no metadata)');
}
