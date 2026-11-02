// Hand-drawn pixel art as text — the reader (no Node APIs: /art-lab/ uses it in the browser too) (v4, docs/ART_BIBLE.md § 1): one character = one colour of src/palette.js.
//   art/sprites/<sheet>.txt → public/game/<sheet>.png + <sheet>.json (frames, duration in ms, tags; like Aseprite's JSON)
// `npm run art` runs it for every file in art/sprites/. It stops with a clear error (file:line) on a row of the wrong
// length, a character that is not in the legend, a missing frame or a missing duration.
//
// File format (lines starting with # are comments):
//   size: 48x48
//   palette:                 one line per character: `<char> <palette name>`; `.` is always transparent.
//     1 navyDark             add `!` after the name when the colour may stand alone (eyes, glints): see tests/art.spec.js
//   tags:                    `<name> <from>-<to>` in sheet columns, optional `jitter=<max changed pixels between frames>`
//     idle 0-3 jitter=40
//   variants:                optional: one row of the sheet per variant (the uniforms). `<name> [a>b c>d …] [acc=<part>]`
//     researcher acc=lens    a>b = swap colour a for b; acc = a part drawn at the frame's `acc=x,y` point
//   === part <name> <w>x<h>  a part (head, arm, accessory…), followed by <h> rows of <w> characters.
//                            In a part `.` leaves the pixel below; `_` clears it to transparent.
//   --- <tag> <n> <ms> [acc=x,y]                    a full frame: <height> rows of <width> characters
//   --- <tag> <n> <ms> from=<tag> <n> [acc=x,y]     a copy of another frame, then only the rows that change: `NN: <row>`
//   @part <name> x,y [flip]                         (inside a frame) paste a part with its top-left corner at x,y
import { PALETTE } from '../../src/palette.js';

export class GridError extends Error {}
export const fail = (file, line, message) => { throw new GridError(`${file}:${line}: ${message}`); };

// Parse one sheet file into { size, legend, tags, variants, parts, frames }. Every frame is a full grid of characters.
export function parseSheet(text, file = 'sheet.txt') {
  const lines = text.split('\n');
  const sheet = { file, size: null, legend: { '.': null }, alone: new Set(), tags: [], variants: [], parts: {}, frames: [] };
  let section = null;
  let block = null; // the part or frame being read

  const checkRow = (row, width, n) => {
    if (row.length !== width) fail(file, n, `row has ${row.length} characters, expected ${width}`);
    for (const ch of row) if (ch !== '_' && !(ch in sheet.legend)) fail(file, n, `character "${ch}" is not in the palette legend`);
  };
  const finish = () => {
    if (!block) return;
    if (block.kind === 'part' && block.rows.length !== block.h) fail(file, block.line, `part "${block.name}" has ${block.rows.length} rows, expected ${block.h}`);
    if (block.kind === 'frame' && !block.from && block.rows.length !== sheet.size.h) fail(file, block.line, `frame ${block.tag} ${block.n} has ${block.rows.length} rows, expected ${sheet.size.h}`);
    block = null;
  };

  lines.forEach((raw, i) => {
    const n = i + 1;
    const line = raw.replace(/\s+$/, '');
    if (!line || /^\s*#/.test(line)) return;
    let m;
    if ((m = line.match(/^size:\s*(\d+)x(\d+)$/))) { sheet.size = { w: +m[1], h: +m[2] }; section = null; return; }
    if (/^(palette|tags|variants):$/.test(line)) { finish(); section = line.slice(0, -1); return; }
    if ((m = line.match(/^=== part (\S+) (\d+)x(\d+)$/))) {
      finish(); section = null;
      block = { kind: 'part', name: m[1], w: +m[2], h: +m[3], rows: [], line: n };
      sheet.parts[m[1]] = block;
      return;
    }
    if ((m = line.match(/^--- (\S+) (\d+)(?: (\d+))?(.*)$/))) {
      finish(); section = null;
      if (!sheet.size) fail(file, n, 'frame before "size:"');
      if (!m[3]) fail(file, n, `frame ${m[1]} ${m[2]} has no duration (ms)`);
      const from = m[4].match(/from=(\S+) (\d+)/);
      const acc = m[4].match(/acc=(-?\d+),(-?\d+)/);
      block = { kind: 'frame', tag: m[1], n: +m[2], ms: +m[3], from: from ? { tag: from[1], n: +from[2] } : null, acc: acc ? { x: +acc[1], y: +acc[2] } : null, rows: [], edits: [], ops: [], line: n };
      sheet.frames.push(block);
      return;
    }
    if (section === 'palette') {
      m = line.trim().match(/^(\S)\s+(\S+)(\s+!)?$/);
      if (!m) fail(file, n, 'palette line must be "<char> <colour name>"');
      if (!(m[2] in PALETTE)) fail(file, n, `colour "${m[2]}" is not in src/palette.js`);
      sheet.legend[m[1]] = m[2];
      if (m[3]) sheet.alone.add(m[1]);
      return;
    }
    if (section === 'tags') {
      m = line.trim().match(/^(\S+)\s+(\d+)-(\d+)(?:\s+jitter=(\d+))?$/);
      if (!m) fail(file, n, 'tag line must be "<name> <from>-<to> [jitter=N]"');
      sheet.tags.push({ name: m[1], from: +m[2], to: +m[3], jitter: m[4] ? +m[4] : null, line: n });
      return;
    }
    if (section === 'variants') {
      const [name, ...rest] = line.trim().split(/\s+/);
      const swap = {};
      let acc = null;
      for (const word of rest) {
        if ((m = word.match(/^(\S)>(\S)$/))) {
          for (const ch of [m[1], m[2]]) if (!(ch in sheet.legend)) fail(file, n, `swap uses "${ch}", not in the palette legend`);
          swap[m[1]] = m[2];
        } else if ((m = word.match(/^acc=(\S+)$/))) acc = m[1];
        else fail(file, n, `cannot read "${word}" (use a>b or acc=<part>)`);
      }
      sheet.variants.push({ name, swap, acc, line: n });
      return;
    }
    if (!block) fail(file, n, 'unexpected line outside a part or a frame');
    if ((m = line.match(/^@part (\S+) (-?\d+),(-?\d+)( flip)?$/))) {
      if (block.kind !== 'frame') fail(file, n, '@part only inside a frame');
      block.ops.push({ part: m[1], x: +m[2], y: +m[3], flip: Boolean(m[4]), line: n });
      return;
    }
    if (block.kind === 'part') { checkRow(line, block.w, n); block.rows.push(line); return; }
    if (block.from) {
      m = line.match(/^(\d+): (.*)$/);
      if (!m) fail(file, n, 'a "from=" frame takes only "NN: <row>" lines and @part');
      if (+m[1] >= sheet.size.h) fail(file, n, `row ${m[1]} is outside the frame`);
      checkRow(m[2], sheet.size.w, n);
      block.edits.push({ y: +m[1], row: m[2] });
      return;
    }
    checkRow(line, sheet.size.w, n);
    block.rows.push(line);
  });
  finish();
  if (!sheet.size) fail(file, 1, 'missing "size: WxH"');
  return resolve(sheet);
}

// Turn every frame into a full grid (copies + row edits + parts) and check that the tags cover every frame.
function resolve(sheet) {
  const { file, size } = sheet;
  const key = (tag, n) => `${tag} ${n}`;
  const byKey = new Map();
  for (const f of sheet.frames) {
    if (byKey.has(key(f.tag, f.n))) fail(file, f.line, `frame ${f.tag} ${f.n} is defined twice`);
    byKey.set(key(f.tag, f.n), f);
  }
  const done = new Map();
  const grid = (f, seen = new Set()) => {
    if (done.has(f)) return done.get(f);
    if (seen.has(f)) fail(file, f.line, 'frames copy each other in a loop');
    seen.add(f);
    let rows;
    if (f.from) {
      const src = byKey.get(key(f.from.tag, f.from.n));
      if (!src) fail(file, f.line, `from=${f.from.tag} ${f.from.n}: no such frame`);
      rows = grid(src, seen).map((r) => [...r]);
      for (const e of f.edits) rows[e.y] = [...e.row];
    } else rows = f.rows.map((r) => [...r]);
    for (const op of f.ops) {
      const part = sheet.parts[op.part];
      if (!part) fail(file, op.line, `@part ${op.part}: no such part`);
      part.rows.forEach((r, py) => [...r].forEach((ch, px) => {
        const x = op.x + (op.flip ? part.w - 1 - px : px), y = op.y + py;
        if (ch === '.' || x < 0 || y < 0 || x >= size.w || y >= size.h) return;
        rows[y][x] = ch === '_' ? '.' : ch;
      }));
    }
    const out = rows.map((r) => r.join(''));
    done.set(f, out);
    return out;
  };
  // Sheet order = tag order, then n.
  const ordered = [];
  for (const tag of sheet.tags) {
    for (let col = tag.from, n = 0; col <= tag.to; col++, n++) {
      const f = byKey.get(key(tag.name, n));
      if (!f) fail(file, tag.line, `tag ${tag.name} needs frame ${n} (column ${col}): missing`);
      if (ordered.length !== col) fail(file, tag.line, `tag ${tag.name} starts at ${tag.from} but the sheet is at column ${ordered.length}`);
      ordered.push({ tag: tag.name, n, ms: f.ms, acc: f.acc, rows: grid(f), line: f.line });
    }
  }
  for (const f of sheet.frames) if (!sheet.tags.some((t) => t.name === f.tag && f.n <= t.to - t.from)) fail(file, f.line, `frame ${f.tag} ${f.n} is outside every tag`);
  if (!sheet.variants.length) sheet.variants.push({ name: 'default', swap: {}, acc: null });
  for (const v of sheet.variants) if (v.acc && !sheet.parts[v.acc]) fail(file, v.line, `acc=${v.acc}: no such part`);
  return { ...sheet, frames: ordered };
}

// The grid of one frame for one variant (swap colours, then draw the accessory at the frame's point).
export function variantRows(sheet, frame, variant) {
  const rows = frame.rows.map((r) => [...r].map((ch) => variant.swap[ch] ?? ch));
  const part = variant.acc && frame.acc ? sheet.parts[variant.acc] : null;
  if (part) part.rows.forEach((r, py) => [...r].forEach((ch, px) => {
    const x = frame.acc.x + px, y = frame.acc.y + py;
    if (ch !== '.' && x >= 0 && y >= 0 && x < sheet.size.w && y < sheet.size.h) rows[y][x] = ch === '_' ? '.' : ch;
  }));
  return rows.map((r) => r.join(''));
}

export function sheetJson(sheet, name) {
  const { w, h } = sheet.size;
  return {
    frames: sheet.frames.map((f, i) => ({ filename: `${name} ${f.tag} ${f.n}`, frame: { x: i * w, y: 0, w, h }, duration: f.ms, ...(f.acc ? { acc: f.acc } : {}) })),
    meta: {
      app: 'scripts/art/grid.js',
      image: `${name}.png`,
      size: { w: w * sheet.frames.length, h: h * sheet.variants.length },
      cell: { w, h },
      frameTags: sheet.tags.map((t) => ({ name: t.name, from: t.from, to: t.to, direction: 'forward' })),
      variants: sheet.variants.map((v, row) => ({ name: v.name, row })),
    },
  };
}

