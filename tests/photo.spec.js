import { test, expect } from '@playwright/test';
import { readdir } from 'node:fs/promises';
import sharp from 'sharp';

// v4 (docs/ART_BIBLE.md § 10): the only photo of the site, made by scripts/photo.js from a private original.
test('the portrait copies are 4:5 WebP with no EXIF, no XMP, no ICC profile, and nothing else is in the folder', async () => {
  expect((await readdir('public/assets/about')).sort()).toEqual(['riccardo-320.webp', 'riccardo-640.webp']);
  for (const [file, w, h] of [['riccardo-640.webp', 640, 800], ['riccardo-320.webp', 320, 400]]) {
    const meta = await sharp(`public/assets/about/${file}`).metadata();
    expect(meta.format, file).toBe('webp');
    expect([meta.width, meta.height], file).toEqual([w, h]);
    expect(meta.exif, `${file} EXIF`).toBeUndefined();
    expect(meta.xmp, `${file} XMP`).toBeUndefined();
    expect(meta.icc, `${file} ICC`).toBeUndefined();
  }
});

test('the private original never reaches the build', async () => {
  const walk = async (dir) => (await readdir(dir, { withFileTypes: true })).flatMap((e) => (e.isDirectory() ? [] : [e.name]));
  const names = [...await walk('dist'), ...await walk('dist/assets'), ...await walk('public/assets/about')];
  expect(names.filter((n) => /buona|IMG_|\.heic$|\.jpe?g$/i.test(n) && !n.includes('og'))).toEqual([]);
});
