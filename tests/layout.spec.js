import { test, expect } from '@playwright/test';

// Finishing pass of 07/11/2026 (section 5 of the audit): the bar, the width of the text, the footer, the spaces above the titles.
for (const prefix of ['', '/es', '/it']) {
  test(`${prefix || '/en'}: the mode bar has at most 2 lines at every width, and the CV is never alone on a line`, async ({ page }) => {
    for (let width = 320; width <= 1100; width += 20) {
      await page.setViewportSize({ width, height: 700 });
      if (width === 320) await page.goto(`${prefix}/levante/`);
      const r = await page.evaluate(() => {
        const box = (s) => document.querySelector(s).getBoundingClientRect();
        const items = ['.to-title', '.modes', '.lang-switch', '.cv-top'].map(box);
        const lines = [...new Set(items.map((i) => Math.round(i.top + i.height / 2)))].filter((y, i, all) => !all.some((o, j) => j < i && Math.abs(o - y) < 12));
        const cv = box('.cv-top'), lang = box('.lang-switch');
        return { lines: lines.length, cvWithOthers: Math.abs(cv.top + cv.height / 2 - lang.top - lang.height / 2) < 12, sideways: document.documentElement.scrollWidth > innerWidth, modeRows: new Set([...document.querySelectorAll('.modes li')].map((li) => Math.round(li.getBoundingClientRect().top))).size };
      });
      expect(r.lines, `${width}: lines`).toBeLessThanOrEqual(2);
      expect(r.modeRows, `${width}: modes`).toBe(1);
      expect(r.cvWithOthers, `${width}: CV`).toBe(true);
      expect(r.sideways, `${width}: sideways`).toBe(false);
      if (width >= 800) expect(r.lines, `${width}: one line`).toBe(1);
    }
  });
}

test('the lines of text are never wider between 768 and 1023 px than on a laptop', async ({ page }) => {
  for (const width of [768, 900, 999, 1023, 1280]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/nipotyno/');
    const widest = await page.locator('.chapter-body > section > p').evaluateAll((ps) => Math.max(...ps.map((p) => p.getBoundingClientRect().width)));
    expect(widest, String(width)).toBeLessThanOrEqual(640);
  }
});

test('the footer lines up with the rest of the title screen', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  for (const [path, content] of [['/', '.title-grid'], ['/404.html', '.lost-body']]) {
    await page.goto(path);
    const left = async (s) => Math.round((await page.locator(s).boundingBox()).x);
    expect(await left('.site-footer .wrap'), path).toBe(await left(content));
    expect(await left('.title-bar .bar'), path).toBe(await left(content));
  }
});

test('the same space above every section title of a case', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  for (const path of ['/nipotyno/', '/levante/', '/es/nipotyno/']) {
    await page.goto(path);
    const gaps = await page.locator('.chapter-body > section + section').evaluateAll((sections) => sections.map((s) => Math.round(s.querySelector('h2').getBoundingClientRect().top - s.previousElementSibling.getBoundingClientRect().bottom)));
    expect(new Set(gaps).size, `${path}: ${gaps}`).toBe(1);
  }
});

for (const [path, must, mustNot] of [
  ['/es/nipotyno/', ['facilitador', 'Pedir cita con el especialista', 'Configuración', 'solución híbrida', 'pruebas'], ['moderador', 'Moderé', 'Montaje', 'apaño', 'visita al especialista', ' tests', ' test ']],
  ['/es/levante/', ['panel de control', 'edge AI', 'cocreé'], ['dashboard', 'IA en el borde', 'co-creé']],
  ['/es/multiplayer/', ['Prácticas de UX Research'], ['Becario', 'becario']],
  ['/it/levante/', ['edge AI'], ['IA edge']],
]) {
  test(`${path}: the words of the CV`, async ({ page }) => {
    await page.goto(path);
    const text = await page.locator('body').textContent();
    for (const word of must) expect(text, word).toContain(word);
    for (const word of mustNot) expect(text, word).not.toContain(word);
  });
}
