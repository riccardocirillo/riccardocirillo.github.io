// The home-run tour (v4, docs/ART_BIBLE.md § 6), started by src/game.js after the home run: one project per base.
// 1st: high five with the coach · 2nd: a fist up without stopping · 3rd: the coach waves "go home", then a high five ·
// home plate: a jump on the plate, the teammates jump with their arms up, the camera closes in on the group, then the
// About me finale. On every base the preview of the project opens (READ ▶ · NEXT BASE →). NOTHING moves on by itself:
// the visitor presses NEXT BASE (or →). Every moment can be skipped (a click, Space): it never holds anything up.
// With reduced motion there are no moments: the runner simply appears on the base.
import { TOUR } from './field-map.js';
import { T, fill } from './strings.js';

const MOMENT = 1400; // the length of a moment (ms), never more than 2 s
const PROJECTS = TOUR.filter((s) => !s.panel).length; // stops that count in "2 of 3"

// ctx (from game.js): stage, runner, crew, byId, crewAt, reduceMotion, sound, sleep, say, setHash, runTo, focusPreview,
// lookAt(point|null), finale()
export function createTour(ctx) {
  const { stage, runner, crew, reduceMotion, sound } = ctx;
  let shown = 0; // the step whose preview is on screen (NEXT counts from it)
  let run = 0; // changes on every new step, so a step that was left behind stops by itself

  function endMoment() {
    stage.classList.remove('is-moment');
    runner.classList.remove('is-highfive', 'is-cheer', 'is-wave');
    for (const el of Object.values(crew)) el.classList.remove('is-highfive', 'is-cheer', 'is-gesture');
  }

  async function moment(s, mine) {
    stage.classList.add('is-moment');
    if (s.stop === 'sensor-lab') { // 3rd: the coach waves the runner home first
      crew.coach3.classList.add('is-gesture');
      await ctx.sleep(360);
      if (mine !== run) return;
      crew.coach3.classList.remove('is-gesture');
    }
    runner.classList.add(`is-${s.moment}`);
    sound.play(s.moment === 'highfive' ? 'clap' : 'cheer');
    for (const [id, anim] of Object.entries(s.with ?? {})) crew[id].classList.add(`is-${anim}`);
    await ctx.sleep(MOMENT);
    if (mine === run) endMoment();
  }

  // Home plate: the jump, the teammates, the camera on the group; then the finale (after the moment, or at once).
  async function homeRun(mine) {
    const group = { x: (ctx.byId.home.x + ctx.crewAt.mateB.x) / 2, y: ctx.byId.home.y };
    if (!reduceMotion.matches) {
      stage.classList.add('is-moment');
      ctx.lookAt(group);
      runner.classList.add('is-wave');
      for (const id of ['mateA', 'mateB', 'mateC']) crew[id]?.classList.add('is-cheer');
      sound.play('cheer');
      await ctx.sleep(MOMENT);
      if (mine !== run) return;
      endMoment();
    }
    ctx.finale();
  }

  async function step(i) {
    const mine = ++run;
    endMoment();
    const s = TOUR[i];
    ctx.setHash(s.stop);
    await ctx.runTo(s.stop, { panelId: s.panel ? null : s.stop });
    if (mine !== run) return;
    shown = i;
    if (s.panel) {
      ctx.say(`${T.tourDone}.`);
      await homeRun(mine);
      return;
    }
    ctx.say(fill(T.countSay, { i: i + 1, n: PROJECTS, name: ctx.nameOf(s.stop) }));
    ctx.focusPreview();
    if (s.moment && !reduceMotion.matches) await moment(s, mine);
  }

  return {
    start() { step(0); },
    next() { if (shown < TOUR.length - 1) step(shown + 1); },
    get step() { return shown; },
    // A click or Space during a moment: it ends at once (never stuck).
    skip() { if (stage.classList.contains('is-moment')) { run++; endMoment(); if (TOUR[shown]?.panel) ctx.finale(); } },
    // Leaving the tour: whatever was still going on stops.
    stop() { run++; endMoment(); },
  };
}
