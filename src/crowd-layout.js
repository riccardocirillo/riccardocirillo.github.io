// Where the fans sit (docs/ART_BIBLE.md § 4): groups of seats with aisles, a fixed seed, so the stands picture
// (scripts/art/stadium.js) and the live crowd (src/crowd.js) always match. World pixels, 6×10 fans.
export const CROWD_ROWS = [114, 123, 132, 141, 150]; // top of each row of fans, back to front
export const CROWD_TOP = 112; // the crowd canvas starts here (52 px high)

export function seeded(seed) {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export function crowdLayout(width = 704) {
  const rnd = seeded(7);
  const seats = [];
  CROWD_ROWS.forEach((y, row) => {
    let x = 4 + (row % 2) * 3;
    while (x < width - 8) {
      if (x % 88 > 80) { x += 7; continue; } // aisles between blocks of seats
      if (rnd() < 0.86) seats.push({ x, y, row, kind: Math.floor(rnd() * 8) });
      x += 7;
    }
  });
  return seats;
}
