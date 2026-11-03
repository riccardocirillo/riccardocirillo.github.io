// The night ballpark of v4 (docs/ART_BIBLE.md § 11), in layers, world 640×360 + a 32 px margin on every side (704×424).
//   stadium-sky.png    1 sky in 3 bands (ordered 4×4 dithering on the edges), stars, moon · 2 generic skyline with lit windows
//   stadium-stands.png 3 the four light towers (lamps off) · 4 the stands with a still crowd (the <canvas> of src/crowd.js
//                      draws the live crowd over it) · 5 the scoreboard frame (src/scoreboard lights it)
//   stadium-halo.png   3 one tower's halo + lit lamps: shown four times, switched on one after the other at the start
//   stadium-field.png  6 wall with generic ads, track, mowed grass in 2 dark tones, light pools with dithered edges,
//                      clustered dirt lit from the top left, clean chalk lines, bases with a shadow, mound, dugout
//   stadium-roof.png   8 the dugout roof, in front of the players
//   shadow.png         7 the short shadows of a player (4 lights → several directions)
//   stadium-apron.png  fix1: the same stadium drawn APRON px further on every side (sky above, skyline, stands and
//                      grass at the sides, grass below), hollow where the world is: wide or tall screens never show a gap
//   stadium.png        everything flattened, for the title screen, the 404 and /art-lab/
// Every colour comes from src/palette.js; no random noise: textures are ordered (dither matrix, fixed patterns, fixed seed).
import sharp from 'sharp';
import { PALETTE } from '../../src/palette.js';
import { WORLD, STOPS, DUGOUT, TOWERS, SCOREBOARD, FIELD_TOP, APRON } from '../../src/field-map.js';
import { loadSheet, render } from './grid.js';
import { CROWD_ROWS, crowdLayout, seeded } from '../../src/crowd-layout.js';

const { width: W, height: H } = WORLD;
const B4 = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
const dith = (x, y, t) => t * 16 > B4[y & 3][x & 3];
const hex = (name) => [1, 3, 5].map((i) => parseInt(PALETTE[name].slice(i, i + 2), 16));

// A layer of w×h pixels whose top-left corner is the world point (x0, y0): the apron starts left of and above the world.
function layer(w = W, h = H, x0 = 0, y0 = 0) {
  const px = Array.from({ length: h }, () => Array(w).fill(null));
  const inside = (x, y) => x >= x0 && y >= y0 && x < x0 + w && y < y0 + h;
  const set = (x, y, c) => { if (inside(x, y)) px[y - y0][x - x0] = c; };
  const get = (x, y) => (inside(x, y) ? px[y - y0][x - x0] : null);
  const rect = (x, y, rw, rh, c) => { for (let yy = y; yy < y + rh; yy++) for (let xx = x; xx < x + rw; xx++) set(xx, yy, c); };
  async function png(file) {
    const data = Buffer.alloc(w * h * 4);
    px.forEach((row, y) => row.forEach((c, x) => { if (c) data.set([...hex(c), 255], (y * w + x) * 4); }));
    await sharp(data, { raw: { width: w, height: h, channels: 4 } }).png({ palette: true, colours: 64, quality: 100, dither: 0, effort: 10, compressionLevel: 9 }).toFile(file);
    return { data, w, h };
  }
  return { px, w, h, x0, y0, x1: x0 + w, y1: y0 + h, set, get, rect, png };
}

// --- 1 + 2: sky and skyline -------------------------------------------------------------------------------------
function sky(L = layer(W, FIELD_TOP)) {
  const rnd = seeded(11);
  for (let y = L.y0; y < FIELD_TOP; y++) for (let x = L.x0; x < L.x1; x++) {
    const t = y / 112;
    let c = 'night';
    if (t > 0.35) c = dith(x, y, (t - 0.35) / 0.25) || t > 0.6 ? 'navyDark' : 'night';
    if (t > 0.7) c = dith(x, y, (t - 0.7) / 0.3) ? 'navy' : 'navyDark';
    L.set(x, y, c);
  }
  for (let i = 0; i < 70; i++) {
    const x = Math.floor(rnd() * W), y = Math.floor(rnd() * 58);
    L.set(x, y, i % 5 ? 'navyPale' : 'white');
    if (i % 9 === 0) { L.set(x - 1, y, 'navyLight'); L.set(x + 1, y, 'navyLight'); L.set(x, y - 1, 'navyLight'); L.set(x, y + 1, 'navyLight'); }
  }
  // the apron: more stars in the sky around the world (a seed of its own, so the world's sky stays the same)
  if (L.x0 < 0) {
    const more = seeded(23);
    for (let i = 0; i < 260; i++) {
      const x = L.x0 + Math.floor(more() * L.w), y = L.y0 + Math.floor(more() * (58 - L.y0));
      if (x >= 0 && x < W && y >= 0) continue;
      L.set(x, y, i % 5 ? 'navyPale' : 'white');
      if (i % 9 === 0) { L.set(x - 1, y, 'navyLight'); L.set(x + 1, y, 'navyLight'); L.set(x, y - 1, 'navyLight'); L.set(x, y + 1, 'navyLight'); }
    }
  }
  // moon: a crescent lit from the left
  for (let y = 18; y < 38; y++) for (let x = 36; x < 56; x++) {
    const inMoon = (x - 46) ** 2 + (y - 28) ** 2 <= 56, bite = (x - 50) ** 2 + (y - 25) ** 2 <= 44;
    if (inMoon && !bite) L.set(x, y, x < 43 ? 'skinPale' : 'skinLight');
  }
  // skyline: generic blocks (no real building), lower behind the scoreboard; the apron goes on at both sides
  const blocks = (from, to, rnd) => {
  let x = from;
  while (x < to) {
    const bw = 12 + Math.floor(rnd() * 22);
    let bh = 10 + Math.floor(rnd() * 24);
    if (x > 282 && x < 422) bh = 6 + Math.floor(rnd() * 8);
    L.rect(x, 114 - bh, bw, bh, 'navyDark');
    L.rect(x, 114 - bh, 1, bh, 'navy'); // lit edge on the left
    for (let yy = 114 - bh + 3; yy < 112; yy += 4) for (let xx = x + 2; xx < x + bw - 2; xx += 4) {
      if (rnd() < 0.28) L.set(xx, yy, rnd() < 0.7 ? 'yellow' : 'skinLight');
    }
    x += bw + Math.floor(rnd() * 3);
  }
  };
  blocks(0, W, rnd);
  if (L.x0 < 0) { const side = seeded(31); blocks(L.x0, 0, side); blocks(W, L.x1, side); }
  return L;
}

// --- 3 + 4 + 5: towers, stands with a still crowd, scoreboard frame ---------------------------------------------
const STAND = { top: 112, bottom: 162 };

function towersInto(L, lit, towers = TOWERS) {
  for (const { x: tx, y: ty } of towers) {
    if (!lit) {
      L.rect(tx + 6, ty + 8, 3, STAND.top + 10 - ty, 'navyDark');
      L.rect(tx + 6, ty + 8, 1, STAND.top + 10 - ty, 'navyMid');
      L.rect(tx - 2, ty, 19, 10, 'navyDark');
      L.rect(tx - 2, ty, 19, 1, 'navyMid');
    }
    for (let yy = ty + 1; yy < ty + 9; yy += 3) for (let xx = tx; xx < tx + 16; xx += 3) {
      L.rect(xx, yy, 2, 2, lit ? ((xx + yy) % 2 ? 'white' : 'yellow') : 'navy');
    }
  }
}

async function fansGrid() {
  const sheet = await loadSheet('fans');
  const { data, width } = render(sheet);
  // fan k (0–7), frame f (0 still, 1 up) → its 6×10 pixels as palette names
  const names = Object.fromEntries(Object.keys(PALETTE).map((n) => [PALETTE[n], n]));
  return (k, f) => {
    const out = [];
    for (let y = 0; y < 10; y++) for (let x = 0; x < 6; x++) {
      const i = ((k * 10 + y) * width + f * 6 + x) * 4;
      if (data[i + 3]) out.push([x, y, names[`#${[0, 1, 2].map((j) => data[i + j].toString(16).padStart(2, '0')).join('')}`]]);
    }
    return out;
  };
}

// The apron's fans: the same rows and aisles, a seed of their own, only outside the world.
function apronSeats(L) {
  const rnd = seeded(29);
  const seats = [];
  CROWD_ROWS.forEach((y, row) => {
    for (let x = L.x0 + 4 + (row % 2) * 3; x < L.x1 - 8; x += 7) {
      if (x > -8 && x < W) continue;
      if (((x % 88) + 88) % 88 > 80) continue;
      if (rnd() < 0.86) seats.push({ x, y, row, kind: Math.floor(rnd() * 8) });
    }
  });
  return seats;
}

async function stands(fan, L = layer(W, STAND.bottom + 2)) {
  towersInto(L, false);
  for (let y = STAND.top; y < STAND.bottom; y++) for (let x = L.x0; x < L.x1; x++) L.set(x, y, (y - STAND.top) % 9 < 7 ? 'navyDark' : 'navy');
  for (const s of L.x0 < 0 ? apronSeats(L) : crowdLayout()) {
    for (const [x, y, c] of fan(s.kind, 0)) L.set(s.x + x, s.y + y, c);
    // the back rows are further from the lights: one pixel in two goes dark (ordered, so no noise)
    if (s.row < 2) for (let y = 0; y < 10; y++) for (let x = 0; x < 6; x++) if (L.get(s.x + x, s.y + y) && (x + y + s.row) % 2 === 0) L.set(s.x + x, s.y + y, 'navyDark');
  }
  // scoreboard frame (the lights inside are HTML, src/scoreboard in game.js)
  const { x: sx, y: sy, w: sw, h: sh } = SCOREBOARD;
  L.rect(sx, sy, sw, sh, 'navyDark');
  L.rect(sx + 2, sy + 2, sw - 4, sh - 4, 'night');
  L.rect(sx + sw / 2 - 2, sy + sh, 4, STAND.top - sy - sh, 'navyDark');
  for (let i = 0; i < 9; i++) L.rect(sx + 8 + i * 9, sy + 16, 6, 6, 'navy');
  for (let i = 0; i < 9; i++) L.rect(sx + 8 + i * 9, sy + 6, 6, 4, i < 5 ? 'navyMid' : 'navy');
  L.rect(sx + 8, sy + 28, sw - 16, 3, 'redDark');
  return L;
}

// --- 3: one halo (dithered glow + lit lamps), 136×112 -------------------------------------------------------------
export const HALO = { w: 136, h: 112, ox: 60, oy: 4 }; // the tower's top-left corner sits at (ox, oy) in the halo
function halo() {
  const L = layer(HALO.w, HALO.h);
  for (let y = 0; y < HALO.h; y++) for (let x = 0; x < HALO.w; x++) {
    const d = Math.hypot(x - (HALO.ox + 7), (y - (HALO.oy + 4)) * 1.2);
    if (d < 55) { const t = 1 - d / 55; if (dith(x, y, t * 0.8)) L.set(x, y, t < 0.55 ? 'navyMid' : 'navyLight'); }
  }
  towersInto(L, true, [{ x: HALO.ox, y: HALO.oy }]); // the lamps, lit
  return L;
}

// --- 6: the field -----------------------------------------------------------------------------------------------
function field(L = layer(W, H)) {
  const [home, first, second, third] = ['home', 'nipotyno', 'levante', 'sensor-lab'].map((id) => STOPS.find((s) => s.id === id));
  const plate = { x: home.x, y: home.y - 4 };
  // outfield wall with generic ads, then the warning track
  L.rect(L.x0, 160, L.w, 12, 'navyDark');
  L.rect(L.x0, 160, L.w, 1, 'navyMid');
  for (let x = 10 - 64 * Math.ceil(-L.x0 / 64); x < L.x1 - 30; x += 64) {
    if (L.x0 === 0 && x >= W - 30) break;
    L.rect(x, 163, 44, 6, 'navy');
    L.rect(x + 3, 165, 14, 2, (x >> 6) % 2 ? 'red' : 'yellow');
    L.rect(x + 20, 165, 20, 2, 'navyLight');
  }
  L.rect(L.x0, 172, L.w, 6, 'dirtDark');
  L.rect(L.x0, 172, L.w, 1, 'wood');
  // mowed grass: two dark tones in a diagonal checker (one direction of light)
  for (let y = FIELD_TOP; y < L.y1; y++) for (let x = L.x0; x < L.x1; x++) {
    const k = y - FIELD_TOP;
    L.set(x, y, (Math.floor((x + k) / 22) + Math.floor((x - k + 704) / 22)) % 2 ? 'grassDeep' : 'grassDark');
  }
  // infield: dirt ring, home circle, mound
  const inDiamond = (x, y, cx, cy, rx, ry) => Math.abs(x - cx) / rx + Math.abs(y - cy) / ry <= 1;
  const mid = { x: second.x, y: (second.y + home.y) / 2 + 1 };
  const mound = { x: mid.x, y: mid.y + 2 };
  for (let y = FIELD_TOP; y < H; y++) for (let x = 0; x < W; x++) {
    const outer = inDiamond(x, y, mid.x, mid.y, 104, 90), inner = inDiamond(x, y, mid.x, mid.y + 2, 80, 68);
    if ((outer && !inner) || Math.hypot(x - plate.x, (y - plate.y) * 1.3) < 26 || ((x - mound.x) / 15) ** 2 + ((y - mound.y) / 10) ** 2 <= 1) L.set(x, y, 'dirtDark');
  }
  // dirt: lit rim top left, dark rim bottom right, clusters of 2–3 px in a fixed pattern
  const grass = (c) => c === 'grassDeep' || c === 'grassDark';
  const snap = L.px.map((r) => [...r]);
  const at = (x, y) => snap[y - L.y0][x - L.x0];
  for (let y = FIELD_TOP + 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    if (at(x, y) !== 'dirtDark') continue;
    if (grass(at(x, y - 1)) || grass(at(x - 1, y))) L.set(x, y, 'dirt');
    else if (grass(at(x, y + 1)) || grass(at(x + 1, y))) L.set(x, y, 'wood');
    else if ((x * 13 + y * 7) % 29 === 0) { L.set(x, y, 'wood'); L.set(x + 1, y, 'wood'); }
    else if ((x * 5 + y * 11) % 37 === 0) { L.set(x, y, 'dirt'); L.set(x, y + 1, 'dirt'); L.set(x + 1, y, 'dirt'); }
  }
  // light pools under the towers: one step lighter, dithered edge
  const up = { grassDark: 'grass', grass: 'grassLight', grassDeep: 'grassDark', wood: 'dirtDark', dirtDark: 'dirt', dirt: 'dirtLight' };
  const pools = [[182, 272, 150], [522, 272, 150], [352, 294, 125]];
  const lit = L.px.map((r) => [...r]);
  for (let y = FIELD_TOP; y < H; y++) for (let x = 0; x < W; x++) {
    for (const [px, py, r] of pools) {
      const d = Math.hypot(x - px, (y - py) * 1.6);
      if (d < r && dith(x, y, Math.min(1, (1 - d / r) * 1.6))) { const c = lit[y - L.y0][x - L.x0]; L.set(x, y, up[c] ?? c); break; }
    }
  }
  // chalk: foul lines from home plate, bases with a shadow, home plate and the boxes
  for (let t = 0; t < 300; t++) {
    const y = plate.y - Math.floor(t * 0.95);
    if (y <= 178) break;
    L.set(plate.x + t, y, 'white');
    L.set(plate.x - t, y, 'white');
  }
  for (const b of [first, second, third]) {
    L.rect(b.x - 3, b.y - 2, 7, 4, 'white');
    L.rect(b.x - 3, b.y + 2, 7, 1, 'greyLight');
    L.rect(b.x - 2, b.y + 3, 7, 1, 'wood'); // shadow
  }
  L.rect(plate.x - 4, plate.y - 1, 9, 3, 'white');
  L.rect(plate.x - 3, plate.y + 2, 7, 1, 'greyLight');
  for (const bx of [plate.x - 17, plate.x + 9]) {
    for (let yy = plate.y - 10; yy <= plate.y + 7; yy++) { L.set(bx, yy, 'greyLight'); L.set(bx + 8, yy, 'greyLight'); }
    for (let xx = bx; xx <= bx + 8; xx++) { L.set(xx, plate.y - 10, 'greyLight'); L.set(xx, plate.y + 7, 'greyLight'); }
  }
  L.rect(mound.x - 6, mound.y - 1, 13, 2, 'white');
  // dugout (bottom left): bench in the dark, roof in a layer of its own
  const d = { x: DUGOUT.x - 70, y: DUGOUT.y - 40 };
  L.rect(d.x, d.y, 140, 8, 'navy');
  L.rect(d.x + 4, d.y + 11, 132, 22, 'night');
  L.rect(d.x + 4, d.y + 26, 132, 3, 'wood');
  L.rect(d.x - 2, d.y + 33, 144, 4, 'greyDark');
  return L;
}

// --- 8: dugout roof, in front of the players ------------------------------------------------------------------------
export const ROOF = { w: 144, h: 12 };
function roof() {
  const L = layer(ROOF.w, ROOF.h);
  L.rect(2, 0, 140, 8, 'navy');
  L.rect(2, 0, 140, 1, 'navyLight');
  L.rect(2, 8, 140, 3, 'red');
  L.rect(2, 11, 140, 1, 'redDark');
  return L;
}

// --- 7: shadows: two short dithered blobs (the lights stand on both sides) ------------------------------------------
function shadow() {
  const L = layer(28, 6);
  for (const [cx, w] of [[9, 9], [19, 8]]) for (let y = 0; y < 6; y++) for (let x = 0; x < 28; x++) {
    if (((x - cx) / w) ** 2 + ((y - 3) / 2.6) ** 2 <= 1 && (x + y) % 2 === 0) L.set(x, y, 'night');
  }
  return L;
}

// --- fix1: the apron, the stadium going on around the world; hollow inside (the layers above cover the world) -------
async function apron(fan) {
  const L = layer(W + 2 * APRON.x, H + 2 * APRON.y, -APRON.x, -APRON.y);
  sky(L);
  await stands(fan, L);
  field(L);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) L.set(x, y, null);
  return L;
}

export async function stadium(out) {
  const fan = await fansGrid();
  const layers = {
    sky: sky(), stands: await stands(fan), halo: halo(), field: field(), roof: roof(), shadow: shadow(), apron: await apron(fan),
  };
  const made = {};
  for (const [name, L] of Object.entries(layers)) made[name] = await L.png(out(name === 'shadow' ? 'shadow.png' : `stadium-${name}.png`));
  // flattened picture: sky, stands, the four halos (lit), field, roof
  const flat = layer(W, H);
  const put = (L, ox = 0, oy = 0) => L.px.forEach((row, y) => row.forEach((c, x) => { if (c) flat.set(ox + x, oy + y, c); }));
  put(layers.sky); put(layers.stands);
  for (const t of TOWERS) put(layers.halo, t.x - HALO.ox, t.y - HALO.oy);
  put(layers.field);
  put(layers.roof, DUGOUT.x - 72, DUGOUT.y - 40);
  await flat.png(out('stadium.png'));
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  const { fileURLToPath } = await import('node:url');
  await stadium((name) => fileURLToPath(new URL(`../../public/game/${name}`, import.meta.url)));
  console.log('✓ stadium layers');
}
