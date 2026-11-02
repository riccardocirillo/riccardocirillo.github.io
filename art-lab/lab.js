// /art-lab/ (dev only): draws the grids of art/ straight from the text files, so every save shows at once (Vite HMR).
// URL: /art-lab/?sheet=batter&variant=0&tag=idle — Playwright screenshots use the same parameters.
import { parseSheet, variantRows } from '../scripts/art/grid-parse.js';
import { PALETTE } from '../src/palette.js';
import { FIELD, STOPS } from '../src/field-map.js';

const files = import.meta.glob('/art/**/*.txt', { query: '?raw', import: 'default', eager: true });
const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
const PAPER_INK = '#1b2a4a';

const names = Object.keys(files).sort((a, b) => (a.includes('/proof/') - b.includes('/proof/')) || a.localeCompare(b));
for (const path of names) $('sheet').append(new Option(path.replace('/art/', '').replace('.txt', ''), path));
if (params.get('sheet')) $('sheet').value = names.find((p) => p.endsWith(`/${params.get('sheet')}.txt`)) ?? names[0];

let sheet = null;
let playing = true;

const luma = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const v = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
  return `rgb(${v},${v},${v})`;
};

// Paint one frame on a canvas at `scale`. mode: 'color' | 'silhouette' | 'grey'. alpha for the onion skin.
function paint(ctx, rows, scale, { mode = 'color', alpha = 1, ox = 0, oy = 0 } = {}) {
  ctx.globalAlpha = alpha;
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    const name = sheet.legend[ch];
    if (!name) return;
    const hex = PALETTE[name];
    ctx.fillStyle = mode === 'silhouette' ? PAPER_INK : mode === 'grey' ? luma(hex) : hex;
    ctx.fillRect(ox + x * scale, oy + y * scale, scale, scale);
  }));
  ctx.globalAlpha = 1;
}

function gridLines(ctx, w, h, scale) {
  if (!$('gridlines').checked) return;
  ctx.strokeStyle = 'rgba(11,15,30,.25)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= w; x++) { ctx.beginPath(); ctx.moveTo(x * scale + 0.5, 0); ctx.lineTo(x * scale + 0.5, h * scale); ctx.stroke(); }
  for (let y = 0; y <= h; y++) { ctx.beginPath(); ctx.moveTo(0, y * scale + 0.5); ctx.lineTo(w * scale, y * scale + 0.5); ctx.stroke(); }
}

const variant = () => sheet.variants[+$('variant').value] ?? sheet.variants[0];
const tagFrames = () => {
  const tag = sheet.tags.find((t) => t.name === $('tag').value) ?? sheet.tags[0];
  return sheet.frames.slice(tag.from, tag.to + 1);
};
const rowsOf = (frame) => variantRows(sheet, frame, variant());

function canvas(w, h, cls = '') {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  if (cls) c.className = cls;
  return c;
}

function drawFrames() {
  const box = $('frames');
  box.replaceChildren();
  const { w, h } = sheet.size;
  tagFrames().forEach((frame, i, all) => {
    const c = canvas(w * 8, h * 8);
    const ctx = c.getContext('2d');
    if ($('onion').checked && i > 0) paint(ctx, rowsOf(all[i - 1]), 8, { alpha: 0.25 });
    paint(ctx, rowsOf(frame), 8);
    gridLines(ctx, w, h, 8);
    const fig = document.createElement('figure');
    const cap = document.createElement('figcaption');
    cap.textContent = `${frame.tag} ${frame.n} · ${frame.ms} ms`;
    fig.append(c, cap);
    box.append(fig);
  });
}

function drawTests() {
  const frame = tagFrames()[0];
  const rows = rowsOf(frame);
  for (const [id, mode] of [['after', 'color'], ['silhouette', 'silhouette'], ['grey', 'grey']]) {
    const ctx = $(id).getContext('2d');
    ctx.clearRect(0, 0, 384, 384);
    paint(ctx, rows, 8, { mode });
  }
  // Before = the old sprite (v3), kept in public/_archive/ (or still in public/game/ before phase C).
  const before = $('before').getContext('2d');
  before.imageSmoothingEnabled = false;
  const img = new Image();
  img.onload = () => { before.clearRect(0, 0, 384, 384); before.drawImage(img, 0, +$('variant').value * 48, 48, 48, 0, 0, 384, 384); };
  img.onerror = () => { if (!img.src.endsWith('/game/runner.png')) img.src = '/game/runner.png'; };
  img.src = '/_archive/runner-v3.png';
}

// The camera crops of § 7 around the batter's spot (home plate), on the stadium picture.
function drawCrops() {
  const box = $('crops');
  box.replaceChildren();
  const bg = new Image();
  bg.onload = () => {
    const W = bg.naturalWidth, H = bg.naturalHeight;
    const sx = W / FIELD.width, sy = H / FIELD.height;
    const home = STOPS.find((s) => s.id === 'home');
    const spot = { x: home.x * sx, y: home.y * sy };
    const crops = [
      ['Desktop 16:9 · whole world', W, H, 1],
      ['Tablet 4:3 · centre', Math.round(H * 4 / 3), H, 1],
      ['Phone portrait · ~130×260 at 3×', 130, Math.min(260, H), 3],
    ];
    for (const [label, cw, ch, scale] of crops) {
      const x0 = Math.max(0, Math.min(W - cw, Math.round(spot.x - cw / 2)));
      const y0 = Math.max(0, Math.min(H - ch, Math.round(spot.y - ch * 0.6)));
      const c = canvas(cw * scale, ch * scale);
      const ctx = c.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(bg, x0, y0, cw, ch, 0, 0, cw * scale, ch * scale);
      const rows = rowsOf(tagFrames()[0]);
      paint(ctx, rows, scale, { ox: Math.round(spot.x - x0 - sheet.size.w / 2) * scale, oy: Math.round(spot.y - y0 - sheet.size.h + 2) * scale });
      const fig = document.createElement('figure');
      const cap = document.createElement('figcaption');
      cap.textContent = label;
      fig.append(c, cap);
      box.append(fig);
    }
  };
  bg.onerror = () => { if (!bg.src.endsWith('/game/night.png')) bg.src = '/game/night.png'; };
  bg.src = '/game/stadium.png';
}

let anim = { i: 0, next: 0 };
function tick(now) {
  if (sheet && playing && now >= anim.next) {
    const frames = tagFrames();
    anim.i = (anim.i + 1) % frames.length;
    const frame = frames[anim.i];
    anim.next = now + frame.ms;
    const rows = rowsOf(frame);
    for (const [id, scale] of [['anim8', 8], ['anim3', 3], ['anim1', 1]]) {
      const ctx = $(id).getContext('2d');
      ctx.clearRect(0, 0, 384, 384);
      paint(ctx, rows, scale);
    }
    $('anim-cap').textContent = `8× · ${frame.tag} ${frame.n} · ${frame.ms} ms`;
  }
  requestAnimationFrame(tick);
}

function load() {
  $('error').hidden = true;
  try {
    const path = $('sheet').value;
    sheet = parseSheet(files[path], path.slice(1));
  } catch (error) {
    $('error').textContent = error.message;
    $('error').hidden = false;
    return;
  }
  const keepTag = params.get('tag') ?? $('tag').value;
  $('variant').replaceChildren(...sheet.variants.map((v, i) => new Option(v.name, i)));
  $('tag').replaceChildren(...sheet.tags.map((t) => new Option(`${t.name} (${t.to - t.from + 1})`, t.name)));
  if (params.get('variant')) $('variant').value = params.get('variant');
  if (sheet.tags.some((t) => t.name === keepTag)) $('tag').value = keepTag;
  draw();
}

function draw() {
  anim = { i: -1, next: 0 };
  drawFrames();
  drawTests();
  drawCrops();
}

$('sheet').addEventListener('change', () => { params.delete('tag'); load(); });
for (const id of ['variant', 'tag', 'onion', 'gridlines']) $(id).addEventListener('change', draw);
$('play').addEventListener('click', () => { playing = !playing; $('play').textContent = playing ? 'Pause' : 'Play'; });
load();
requestAnimationFrame(tick);
