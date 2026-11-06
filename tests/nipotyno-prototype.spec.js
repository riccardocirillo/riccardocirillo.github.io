import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Nipotyno, "Try the prototype" (06/11/2026). The real prototype is an external site: here it is a stub, so CI does not depend on it.
const URL_ = 'https://hi-fiprotohci.vercel.app/';
const LANGS = [
  { path: '/nipotyno/', load: 'Load the prototype', full: 'Full screen', title: 'Nipotyno high-fidelity prototype', close: 'Close', data: 'Test data (fictional)' },
  { path: '/es/nipotyno/', load: 'Cargar el prototipo', full: 'Pantalla completa', title: 'Prototipo de alta fidelidad de Nipotyno', close: 'Cerrar', data: 'Datos de prueba (ficticios)' },
  { path: '/it/nipotyno/', load: 'Carica il prototipo', full: 'Schermo intero', title: 'Prototipo ad alta fedeltà di Nipotyno', close: 'Chiudi', data: 'Dati di prova (fittizi)' },
];
const EN = LANGS[0];

async function stub(page) {
  const hits = { n: 0 };
  await page.route(`${URL_}**`, (route) => {
    hits.n += 1;
    return route.fulfill({ contentType: 'text/html', body: '<!doctype html><html lang="it"><title>Prototipo</title><main><h1>Prototipo</h1><button>Normale</button></main></html>' });
  });
  return hits;
}
const frame = (page) => page.frameLocator('.proto iframe');
const stage = (page) => page.locator('.proto-stage');
const axe = async (page, what) => {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(results.violations.map((v) => `${what} · ${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([]);
};

test.describe('prototype @ 1280', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  for (const l of LANGS) {
    test(`${l.path}: facade, no iframe before the click, iframe after it`, async ({ page }) => {
      const hits = await stub(page);
      await page.goto(l.path);
      await expect(page.getByRole('button', { name: l.load })).toBeVisible();
      await expect(page.getByRole('button', { name: l.full })).toBeVisible();
      await expect(page.locator('iframe')).toHaveCount(0);
      expect(hits.n).toBe(0);
      await expect(page.locator('.proto-data summary')).toHaveText(l.data);

      await page.getByRole('button', { name: l.load }).click();
      const iframe = page.locator('.proto iframe');
      await expect(iframe).toHaveAttribute('src', URL_);
      await expect(iframe).toHaveAttribute('title', l.title);
      await expect(iframe).toHaveAttribute('allow', 'fullscreen');
      await expect(frame(page).getByRole('button', { name: 'Normale' })).toBeVisible();
      await expect(page.getByRole('button', { name: l.load })).toBeHidden();
      await expect(page.getByRole('button', { name: l.full })).toBeFocused();
    });
  }

  test('the iframe is as wide as the column, 16:10', async ({ page }) => {
    await stub(page);
    await page.goto(EN.path);
    await page.getByRole('button', { name: EN.load }).click();
    const iframe = await page.locator('.proto iframe').boundingBox();
    const column = await page.locator('section:has(.proto)').boundingBox();
    expect(Math.abs(iframe.width + 6 - column.width)).toBeLessThanOrEqual(1); // 3 px border on each side
    expect(iframe.width / iframe.height).toBeCloseTo(1.6, 1);
  });

  test('full screen: same iframe (no reload), focus trapped, Esc and Close leave, focus goes back', async ({ page }) => {
    const hits = await stub(page);
    await page.goto(EN.path);
    await page.getByRole('button', { name: EN.load }).click();
    await frame(page).locator('main').evaluate((el) => { el.dataset.progress = 'kept'; });

    const full = page.getByRole('button', { name: EN.full });
    await full.click();
    await expect(stage(page)).toHaveJSProperty('open', true);
    const close = page.getByRole('button', { name: EN.close });
    await expect(close).toBeFocused();
    const box = await page.locator('.proto iframe').boundingBox();
    expect(box.width).toBe(1280);
    expect(box.height).toBeGreaterThan(700);
    await expect(frame(page).locator('main')).toHaveAttribute('data-progress', 'kept');
    expect(hits.n).toBe(1);
    expect(new URL(page.url()).pathname).toBe(EN.path); // same page

    for (let i = 0; i < 6; i += 1) { // Tab never reaches the page behind
      await page.keyboard.press('Tab');
      const inPage = await page.evaluate(() => {
        const el = document.activeElement;
        return el !== document.body && !el.closest('.proto-stage');
      });
      expect(inPage).toBe(false);
    }

    await close.focus();
    await page.keyboard.press('Escape');
    await expect(stage(page)).toHaveJSProperty('open', false);
    await expect(full).toBeFocused();

    await full.click();
    await close.click();
    await expect(stage(page)).toHaveJSProperty('open', false);
    await expect(full).toBeFocused();
    await expect(frame(page).locator('main')).toHaveAttribute('data-progress', 'kept');
    expect(hits.n).toBe(1);
  });

  test('Full screen as the first click loads and opens', async ({ page }) => {
    await stub(page);
    await page.goto(EN.path);
    await page.getByRole('button', { name: EN.full }).click();
    await expect(stage(page)).toHaveJSProperty('open', true);
    await expect(frame(page).getByRole('button', { name: 'Normale' })).toBeVisible();
  });

  test('axe: no new errors on the facade, loaded and full screen', async ({ page }) => {
    await stub(page);
    await page.goto(EN.path);
    await page.locator('.proto').scrollIntoViewIfNeeded();
    await axe(page, 'facade');
    await page.getByRole('button', { name: EN.load }).click();
    await expect(frame(page).getByRole('button', { name: 'Normale' })).toBeVisible();
    await axe(page, 'loaded');
    await page.getByRole('button', { name: EN.full }).click();
    await axe(page, 'full screen');
  });

  test.describe('inside the reader of the game', () => {
    test.beforeEach(async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await stub(page);
      await page.goto('/play/#nipotyno');
      await page.locator('#field-panel').getByRole('link', { name: /Read/i }).click();
      await expect(page.locator('dialog.reader .proto')).toBeVisible();
    });
    const reader = (page) => page.locator('dialog.reader');

    test('the buttons work; Esc closes only the full screen, the next Esc closes the reader', async ({ page }) => {
      await expect(page.locator('iframe')).toHaveCount(0);
      await reader(page).getByRole('button', { name: EN.full }).click();
      await expect(stage(page)).toHaveJSProperty('open', true);
      await page.keyboard.press('Escape');
      await expect(stage(page)).toHaveJSProperty('open', false);
      await expect(reader(page)).toHaveJSProperty('open', true);
      await expect(reader(page).getByRole('button', { name: EN.full })).toBeFocused();
      await expect(page).toHaveURL(/\/nipotyno\/$/);
      await page.keyboard.press('Escape');
      await expect(reader(page)).toHaveJSProperty('open', false);
      await expect(page).toHaveURL(/\/play\/#nipotyno$/);
    });

    test('loading the prototype adds no history entry: one Back closes the reader', async ({ page }) => {
      await reader(page).getByRole('button', { name: EN.load }).click();
      await expect(frame(page).getByRole('button', { name: 'Normale' })).toBeVisible();
      await page.goBack();
      await expect(reader(page)).toHaveJSProperty('open', false);
    });

    test('Back during the full screen closes both and the game still answers', async ({ page }) => {
      await reader(page).getByRole('button', { name: EN.full }).click();
      await expect(stage(page)).toHaveJSProperty('open', true);
      await page.goBack();
      await expect(reader(page)).toHaveJSProperty('open', false);
      await page.locator('#field-panel').getByRole('link', { name: /Read/i }).click({ timeout: 3000 }); // nothing left modal over the page
      await expect(reader(page)).toHaveJSProperty('open', true);
      await expect(reader(page).locator('iframe')).toHaveCount(0); // a fresh copy of the page: back to the facade
    });
  });
});

test.describe('prototype @ 390', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('the iframe keeps 1000 px inside and is scaled to the column; nothing scrolls sideways', async ({ page }) => {
    await stub(page);
    await page.goto(EN.path);
    await page.getByRole('button', { name: EN.load }).click();
    await expect(frame(page).getByRole('button', { name: 'Normale' })).toBeVisible();
    const size = await page.locator('.proto iframe').evaluate((el) => ({ inner: el.offsetWidth, shown: el.getBoundingClientRect().width, box: el.parentElement.clientWidth }));
    expect(size.inner).toBe(1000);
    expect(Math.abs(size.shown - size.box)).toBeLessThanOrEqual(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });
});

test.describe('prototype without JavaScript', () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 1280, height: 800 } });

  for (const l of LANGS) {
    test(`${l.path}: the preview is a normal link to a new tab, no dead buttons`, async ({ page }) => {
      await page.goto(l.path);
      const link = page.locator('.proto-poster');
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute('href', URL_);
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(page.getByRole('button', { name: l.load })).toHaveCount(0);
      await expect(page.locator('iframe')).toHaveCount(0);
    });
  }
});

// Nipotyno, Test: the schema of the phases (06/11/2026).
const SCHEMA = [
  { path: '/nipotyno/', title: 'One session, seven steps', first: '6 older adults at home' },
  { path: '/es/nipotyno/', title: 'Una sesión, siete pasos', first: '6 personas mayores en su casa' },
  { path: '/it/nipotyno/', title: 'Una sessione, sette passi', first: '6 anziani a casa loro' },
];
test.describe('schema of the test phases', () => {
  for (const l of SCHEMA) {
    test(`${l.path}: new text, 7 steps before the metrics, no facsimile`, async ({ page, request }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(l.path);
      const test_ = page.locator('section#test');
      await expect(test_.locator('> p').first()).toContainText(l.first);
      await expect(test_.locator('.phases h3')).toHaveText(l.title);
      await expect(test_.locator('.phases ol > li')).toHaveCount(7);
      await expect(test_.locator('.phases li.is-task')).toHaveCount(2);
      await expect(test_.locator('.phases-facts > div')).toHaveCount(4);
      await expect(page.locator('img[src*="pagopa.webp"]')).toHaveCount(0);
      expect(await test_.locator('.phases').evaluate((el) => !!(el.compareDocumentPosition(el.parentElement.querySelector('table')) & Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
      expect((await request.get('/assets/nipotyno/pagopa.webp')).headers()['content-type'] ?? '').not.toContain('webp');
    });
    for (const [w, cols] of [[1280, 7], [1000, 7], [390, 1]]) {
      test(`${l.path} @ ${w}: ${cols} column(s), no text out of its card, the dashed box covers nothing, nothing scrolls sideways`, async ({ page }) => {
        await page.setViewportSize({ width: w, height: 800 });
        await page.goto(l.path);
        const r = await page.locator('.phases').evaluate((el) => {
          const lis = [...el.querySelectorAll('ol > li')];
          const tops = new Set(lis.map((li) => Math.round(li.getBoundingClientRect().top)));
          const measure = el.querySelector('.phases-measure').getBoundingClientRect();
          const facts = el.querySelector('.phases-facts').getBoundingClientRect();
          const task = el.querySelector('.is-task .phases-card').getBoundingClientRect();
          const cards = lis.map((li) => li.querySelector('.phases-card'));
          return {
            perRow: lis.length / tops.size,
            overflow: cards.filter((c) => c.scrollWidth > c.clientWidth + 1).length,
            measureLeft: measure.left, taskLeft: task.left, measureBottom: measure.bottom, factsTop: facts.top,
            pageWidth: document.documentElement.scrollWidth,
          };
        });
        expect(r.perRow).toBe(cols);
        expect(r.overflow).toBe(0);
        expect(r.measureBottom).toBeLessThanOrEqual(r.factsTop);
        if (cols === 7) expect(Math.abs(r.measureLeft - r.taskLeft)).toBeLessThanOrEqual(1); // under steps 4 and 5
        expect(r.pageWidth).toBeLessThanOrEqual(w);
      });
    }
  }
  test('inside the reader of the game: 7 columns, nothing scrolls sideways', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/play/#nipotyno');
    await page.locator('#field-panel').getByRole('link', { name: /Read/i }).click();
    const body = page.locator('dialog.reader .reader-body');
    await expect(body.locator('.phases ol > li')).toHaveCount(7);
    const r = await body.evaluate((el) => {
      const lis = [...el.querySelectorAll('.phases ol > li')];
      return { wide: el.scrollWidth <= el.clientWidth, rows: new Set(lis.map((li) => Math.round(li.getBoundingClientRect().top))).size };
    });
    expect(r).toEqual({ wide: true, rows: 1 });
  });
  test('Levante and Sensor lab keep their layout (one grid, no wide part)', async ({ page }) => {
    await page.goto('/levante/');
    await expect(page.locator('.chapter-rest')).toHaveCount(0);
  });
});
