// The live crowd (docs/ART_BIBLE.md § 4): a <canvas> over the stands, redrawn at 8 fps inside the one game loop.
// Still: 1 fan in 12 changes frame every 1–2 s. Home run: an "ola" crosses the stands in 1.5 s, with phone flashes.
// Reduced motion: drawn once, still, no flashes. The fans are public/game/fans.png (8 kinds × still/up, 6×10 each).
import { every } from './loop.js';
import { crowdLayout, CROWD_TOP } from './crowd-layout.js';

const FPS = 8;
const DARK = '#0f1a30'; // navyDark: the back rows get one pixel in two, like the stands picture
const FLASH = ['#ffffff', '#c7ecff'];

export function createCrowd(canvas, { reduceMotion }) {
  const ctx = canvas.getContext('2d');
  const seats = crowdLayout(canvas.width);
  const sheet = new Image();
  let ready = false;
  let stop = null;
  let ola = null; // { start }
  let flashes = [];
  let lastDraw = 0;
  const active = new Map(); // seat index → time of its next change

  // The two back rows: copies of the sheet with one pixel in two dark (made once, parity of the row).
  const darker = [];
  function makeDarker() {
    for (const parity of [0, 1]) {
      const c = document.createElement('canvas');
      c.width = sheet.width; c.height = sheet.height;
      const g = c.getContext('2d');
      g.drawImage(sheet, 0, 0);
      const img = g.getImageData(0, 0, c.width, c.height);
      const [r, gg, b] = [1, 3, 5].map((i) => parseInt(DARK.slice(i, i + 2), 16));
      for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
        const i = (y * c.width + x) * 4;
        if (img.data[i + 3] && ((x % 6) + (y % 10) + parity) % 2 === 0) img.data.set([r, gg, b], i);
      }
      g.putImageData(img, 0, 0);
      darker.push(c);
    }
  }

  function drawSeat(s, up) {
    const y = s.y - CROWD_TOP;
    ctx.clearRect(s.x, y, 6, 9); // the 10th row is the same in both frames and under the next row's heads
    ctx.drawImage(s.row < 2 ? darker[s.row] : sheet, up ? 6 : 0, s.kind * 10, 6, 10, s.x, y, 6, 10);
  }

  function drawAll() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const s of seats) drawSeat(s, s.up);
  }

  function step(now) {
    if (now - lastDraw < 1000 / FPS) return;
    lastDraw = now;
    // the ola: a window of 70 px running left to right in 1.5 s
    if (ola) {
      const t = (now - ola.start) / 1500;
      const front = t * (canvas.width + 70);
      for (const s of seats) s.up = s.x < front && s.x > front - 70;
      if (t > 1) { ola = null; for (const s of seats) s.up = false; }
      flashes = flashes.filter((f) => f.until > now);
      if (Math.random() < 0.6) flashes.push({ x: Math.floor(Math.random() * canvas.width), y: 2 + Math.floor(Math.random() * 46), until: now + 250 });
      drawAll();
      for (const f of flashes) { ctx.fillStyle = FLASH[f.x % 2]; ctx.fillRect(f.x, f.y, 1, 1); }
      return;
    }
    // still: one fan in twelve is "awake" and changes frame every 1–2 s
    if (active.size < seats.length / 12) {
      const i = Math.floor(Math.random() * seats.length);
      if (!active.has(i)) active.set(i, now + 1000 + Math.random() * 1000);
    }
    for (const [i, at] of active) {
      if (now < at) continue;
      const s = seats[i];
      s.up = !s.up;
      drawSeat(s, s.up);
      if (!s.up && Math.random() < 0.5) active.delete(i);
      else active.set(i, now + 1000 + Math.random() * 1000);
    }
  }

  sheet.onload = () => {
    makeDarker();
    ready = true;
    drawAll();
    if (!reduceMotion.matches) stop = every(step);
  };
  sheet.src = '/game/fans.png';

  return {
    // Home run: the ola and the flashes (nothing with reduced motion).
    cheer() {
      if (!ready || reduceMotion.matches) return;
      ola = { start: performance.now() };
      if (!stop) stop = every(step);
    },
    // Reduced motion switched on in the pause menu: everything still.
    still() {
      if (stop) stop();
      stop = null;
      ola = null;
      for (const s of seats) s.up = false;
      if (ready) drawAll();
    },
    resume() { if (ready && !stop && !reduceMotion.matches) stop = every(step); },
  };
}
