// At bat: the pitcher throws again and again until the visitor swings
// (click/tap the field, Space or the "Swing!" button — wired in src/game.js).
// You can't miss: a swing at any moment hits the next ball that reaches the plate, and it is always a home run.
// With reduced motion there is no pitch: a swing shows "Home run!" straight away.
import { FIELD } from './field-map.js';
import { sound } from './sound.js';
import { every } from './loop.js';

// World pixels (704×424), like src/field-map.js (v4).
const RELEASE = { x: 344, y: 262 }; // the pitcher's hand
const PLATE = { x: 362, y: 346 }; // where the bat meets the ball
const CATCHER = { x: 356, y: 392 };
const OUT = { x: 520, y: 40 }; // over the stands

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function atBat({ stage, runner, pitcher, ball, banner, reduceMotion, onHomeRun = () => {}, onContact = () => {} }) {
  const trail = [...stage.querySelectorAll('.trail i')];
  const history = [];
  let pitching = null; // { cancelled } while the pitch loop runs
  let swing = null; // { promise, resolve } once the visitor has swung

  const put = ({ x, y }, withTrail = false) => {
    ball.style.setProperty('--x', `${(x / FIELD.width) * 100}%`);
    ball.style.setProperty('--y', `${(y / FIELD.height) * 100}%`);
    // the trail: the last 6 positions of the ball in flight (only after the hit)
    history.unshift({ x, y });
    history.length = Math.min(history.length, 6);
    trail.forEach((el, i) => {
      const p = withTrail && history[i + 1];
      el.hidden = !p;
      if (p) { el.style.setProperty('--x', `${(p.x / FIELD.width) * 100}%`); el.style.setProperty('--y', `${(p.y / FIELD.height) * 100}%`); }
    });
  };

  // Move the ball from `a` to `b` in `ms`, `arc` field pixels high. Resolves false if cancelled.
  const fly = (a, b, ms, arc, run, withTrail = false) => new Promise((resolve) => {
    const t0 = performance.now();
    const stop = every((now) => {
      if (run.cancelled) { stop(); return resolve(false); }
      const p = Math.min((now - t0) / ms, 1);
      put({ x: a.x + (b.x - a.x) * p, y: a.y + (b.y - a.y) * p - arc * Math.sin(Math.PI * p) }, withTrail);
      if (p >= 1) { stop(); resolve(true); }
    });
  });

  async function homeRun(run) {
    runner.classList.replace('is-batting', 'is-swinging');
    // load, step and smear (240 ms), then the contact and the impact pause (120 ms): the hit is felt
    await sleep(240);
    if (run.cancelled) return;
    stage.classList.add('is-impact');
    sound.play('crack');
    onContact();
    await sleep(120);
    stage.classList.remove('is-impact');
    if (run.cancelled) return;
    if (!(await fly(PLATE, OUT, 900, 60, run, true))) return;
    for (const el of trail) el.hidden = true;
    ball.hidden = true;
    banner.hidden = false;
    onHomeRun();
    sound.play('crowd');
    await sleep(1300);
    if (run.cancelled) return;
    finish();
  }

  async function loop(run) {
    while (!run.cancelled) {
      await sleep(swing ? 150 : 1100);
      if (run.cancelled) return;
      pitcher.classList.add('is-pitching');
      await sleep(650);
      if (run.cancelled) return;
      put(RELEASE);
      ball.hidden = false;
      if (!(await fly(RELEASE, PLATE, 550, 9, run))) return;
      pitcher.classList.remove('is-pitching');
      if (swing) return homeRun(run);
      await fly(PLATE, CATCHER, 200, 0, run); // no swing: the catcher gets it, here comes another one
      ball.hidden = true;
    }
  }

  function clear() {
    if (pitching) pitching.cancelled = true;
    pitching = null;
    ball.hidden = true;
    banner.hidden = true;
    pitcher.classList.remove('is-pitching');
    runner.classList.remove('is-batting', 'is-swinging');
    stage.classList.remove('is-batting');
  }

  function finish() {
    const done = swing;
    swing = null;
    clear();
    done?.resolve();
  }

  return {
    get active() { return Boolean(pitching); },
    // The batter steps in and the pitches start.
    start() {
      clear();
      swing = null;
      pitching = { cancelled: false };
      runner.classList.add('is-batting');
      stage.classList.add('is-batting');
      if (!reduceMotion.matches) loop(pitching);
    },
    // The visitor swings: resolves after the home run. Several presses = the same swing.
    swing() {
      if (!pitching) return Promise.resolve();
      if (swing) return swing.promise;
      let resolve;
      swing = { promise: new Promise((r) => { resolve = r; }) };
      swing.resolve = resolve;
      if (reduceMotion.matches) {
        sound.play('crack');
        sound.play('crowd');
        banner.hidden = false;
        onHomeRun();
        sleep(600).then(() => { if (pitching) finish(); });
      }
      return swing.promise;
    },
    // Leave the at-bat (the visitor went to a base instead): nothing is pending any more.
    stop() {
      swing = null;
      clear();
    },
  };
}
