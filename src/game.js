// The game (/play/, F5). Optional: without this file the bases are plain links and a sentence links the case pages.
// Modes:
// - pick (first visit): choose a uniform (3 small tiles) or skip
// - bat: the pitcher throws, the visitor swings (click/tap the field, Space, "Swing!") → home run → tour
// - tour: src/tour.js — one project per base, nothing moves on by itself ("Next base" / "◀ Back" in the card)
// - free: click/tap a base or ← → and the runner runs there · "Play again" starts again
// The HUD on top: ⏸ Pause · Esc, the base, the bases visited, sound. Esc (or ⏸) opens the pause menu, a modal dialog with
// Resume · Read this project · Switch to Story mode · Multiplayer · Title screen, then language, sound and motion.
// Every base opens its card over the stadium (a drawer on desktop, under the stage on phones); ✕ Close closes it.
// The address shows the base (/play/#nipotyno) and is only REPLACED, never added to: one Back press leaves the page.
// Deep links skip the uniform and the at-bat. With reduced motion: no pitch and no zoom (the tour is the same, still).
import { FIELD, WORLD, CORE, APRON, FIELD_TOP, STOPS, RING, CREW, ON_DECK, TOUR } from './field-map.js';
import { every } from './loop.js';
import { createCrowd } from './crowd.js';
import { createReader } from './reader.js';
import { UNIFORMS } from './uniforms.js';
import { atBat } from './batting.js';
import { sound } from './sound.js';
import { createTour } from './tour.js';
import { T, fill } from './strings.js'; // the sentences in the page's language

const stage = document.querySelector('.stage');
const field = document.querySelector('#field');
if (stage) start();

// The visitor's choices in this browser (storage may be blocked: then nothing is remembered).
function load(key) { try { return localStorage.getItem(key); } catch { return null; } }
function save(key, value) { try { localStorage.setItem(key, value); } catch { /* ignore */ } }
// The state of this visit (v4, ART_BIBLE § 6): bases visited and uniform, in sessionStorage (may be blocked too).
function loadSession() { try { return JSON.parse(sessionStorage.getItem('game') ?? '{}'); } catch { return {}; } }
function saveSession(state) { try { sessionStorage.setItem('game', JSON.stringify(state)); } catch { /* ignore */ } }

function start() {
  const runner = stage.querySelector('.runner');
  const runnerShadow = stage.querySelector('.runner-shadow');
  const panel = document.querySelector('#field-panel');
  const links = [...stage.querySelectorAll('.base[data-stop]')];
  const byId = Object.fromEntries(STOPS.map((s) => [s.id, s]));
  const world = stage.querySelector('.world');
  const swingBox = stage.querySelector('.swing-box');
  const pick = field.querySelector('.uniform-pick');
  const wide = matchMedia('(min-width: 1000px)'); // the card is a drawer over the stage from here up
  const crewAt = Object.fromEntries(CREW.map((m) => [m.id, m]));
  const crew = Object.fromEntries([...stage.querySelectorAll('[data-crew]')].map((el) => [el.dataset.crew, el]));
  const SPEED = 110; // field pixels per second

  // Reduced motion: the system setting, or the switch in the pause menu (remembered).
  const systemMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let motionOff = load('motion') === 'reduced';
  const reduceMotion = { get matches() { return systemMotion.matches || motionOff; } };

  const hud = field.querySelector('.hud');
  const hudBase = hud.querySelector('.hud-base');
  const diamonds = [...hud.querySelectorAll('.hud-diamonds i')];
  const pauseButton = hud.querySelector('[data-action="pause"]');
  const dialog = field.querySelector('dialog.pause');
  const bar = field.querySelector('.game-bar');
  const rows = Object.fromEntries([...bar.querySelectorAll('.bar-row[data-mode]')].map((row) => [row.dataset.mode, row]));
  const swingButton = field.querySelector('[data-action="swing"]');
  const status = bar.querySelector('[role="status"]');
  const batting = atBat({
    stage, runner, pitcher: crew.pitcher, ball: stage.querySelector('.ball'), banner: stage.querySelector('.banner'), reduceMotion,
    // the contact: a white flash (2 frames) and the screen shakes 2 px three times (none with reduced motion)
    onContact() {
      if (reduceMotion.matches) return;
      stage.classList.add('is-flash', 'is-shake');
      setTimeout(() => stage.classList.remove('is-flash', 'is-shake'), 300);
    },
    // over the stands: HOME RUN on the scoreboard (3 s), fireworks (3 bursts), the ola in the stands
    onHomeRun() {
      scoreboard.classList.add('is-home-run');
      if (!reduceMotion.matches) stage.classList.add('is-homerun');
      setTimeout(() => { scoreboard.classList.remove('is-home-run'); stage.classList.remove('is-homerun'); }, 3000);
      crowd.cheer();
    },
  });

  let mode = 'free';
  let current = 'home';
  let pos = { x: byId.home.x, y: byId.home.y };
  let running = null;
  let opener = null; // the link that opened the card: the focus goes back to it on close
  let looking = null; // the point the card is about (for the camera)
  const scoreboard = stage.querySelector('.scoreboard');
  const scoreLights = [...scoreboard.querySelectorAll('.sb-bases i')];
  const crowd = createCrowd(stage.querySelector('.crowd'), { reduceMotion });
  const visited = new Set(loadSession().visited ?? []);
  const finale = field.querySelector('#finale');
  // Keyboard or pointer: the focus jumps to READ only for keyboard visitors (the preview never traps the focus).
  let keyboardUser = false;
  addEventListener('keydown', () => { keyboardUser = true; }, true);
  addEventListener('pointerdown', () => { keyboardUser = false; }, true);

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const say = (text) => { status.textContent = text; };
  // Names and labels as written on the page (already in its language): "Levante", "2nd base".
  const textOf = (id, part) => field.querySelector(`.bases [data-stop="${id}"] .base-${part}`).textContent;
  const nameOf = (id) => textOf(id, 'name');
  const isProject = (id) => id !== 'home' && Boolean(byId[id]);

  // The runner, his shadow (a layer under everyone) and his drawing order (--fy, the row of his feet: lower = in front).
  const place = ({ x, y }) => {
    for (const el of [runner, runnerShadow]) {
      el.style.setProperty('--x', `${(Math.round(x) / FIELD.width) * 100}%`);
      el.style.setProperty('--y', `${(Math.round(y) / FIELD.height) * 100}%`);
    }
    runner.style.setProperty('--fy', Math.round(y));
  };

  // --- Full screen (fix1, ART_BIBLE § 7): the CORE of the stadium (lamps to dugout, src/field-map.js) is always in view ---
  // Scale: the largest whole number with which the core fits on the screen under the HUD; phones held upright 2× (the
  // whole height of the stadium, the camera only moves sideways). The apron (more stadium drawn around the world) fills
  // what is left; a fractional scale (in 1/48 steps, so a sprite cell stays whole pixels; nearest neighbour) only where a
  // whole number would leave a gap, or where the core fits less than 2× (see fit()). Camera: translate() of whole screen pixels with a small delay
  // (lerp). The core is centred; the camera follows the runner only where the core does not fit (phones), and moves
  // aside for the card when it would cover the base.
  const cam = { x: 0, y: 0, tx: 0, ty: 0, s: 1, w: 0, h: 0, top: 0, fitX: true, fitY: true, restX: 0, restY: 0 };
  const DRAWN = { w: WORLD.width + 2 * APRON.x, h: WORLD.height + 2 * APRON.y };
  function fit() {
    cam.w = innerWidth; cam.h = innerHeight;
    cam.top = hud.offsetHeight;
    const room = cam.h - cam.top;
    const upright = cam.h > cam.w * 1.2;
    const most = upright ? Math.min(2, room / CORE.h) : Math.min(cam.w / CORE.w, room / CORE.h);
    const cover = Math.max(cam.w / DRAWN.w, cam.h / DRAWN.h);
    // under 2× a whole number would leave the core small (1× = half a laptop screen) or cut (phones held sideways):
    // then the scale is the largest that keeps the core whole, in 1/48 steps
    let s = most >= 2 ? Math.floor(most) : Math.floor(most * 48) / 48;
    if (s < cover) s = Math.ceil(cover * 48) / 48;
    cam.s = s;
    cam.fitX = CORE.w * s <= cam.w;
    cam.fitY = CORE.h * s <= room + 1;
    cam.restX = cam.fitX ? Math.round((cam.w - CORE.w * s) / 2 - CORE.x * s) : 0;
    cam.restY = Math.round(cam.fitY ? cam.top + (room - CORE.h * s) / 2 - CORE.y * s : cam.top - CORE.y * s);
    field.style.setProperty('--fs', s);
    field.style.setProperty('--hud-h', `${cam.top}px`);
    // phones held upright: the uniform bar sits on the outfield grass, between the wall and 2nd base (src/style.css)
    field.style.setProperty('--band-top', `${cam.restY + (FIELD_TOP + 6) * s}px`);
    aim(true);
  }
  function aim(snap = false) {
    // while the uniform is chosen (phones): the runner on deck and home plate, where he is going, both in the picture
    const point = looking ?? (mode === 'pick' ? { x: (pos.x * 2 + byId.home.x) / 3, y: pos.y } : pos);
    const s = cam.s;
    const cardOpen = !panel.hidden;
    const phone = cam.w < 700;
    const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
    let tx = cam.restX, ty = cam.restY;
    if (!cam.fitX) tx = clamp((cardOpen && !phone ? cam.w * 0.3 : cam.w * 0.5) - point.x * s, cam.w - WORLD.width * s, 0);
    else if (cardOpen && !phone) {
      // the card on the right: if it would cover the point (and the coach next to it), slide the stadium left just enough
      const edge = cam.w - panel.offsetWidth - 16 - 64 * s; // 64 world px: the coach next to the base and his arm
      tx -= Math.max(0, tx + point.x * s - edge);
    }
    if (cardOpen && phone) {
      // the sheet at the bottom: lift the stadium so the point stays above it
      const sheet = panel.offsetHeight;
      ty = Math.min(ty, cam.top + (cam.h - sheet - cam.top) * 0.6 - point.y * s);
    }
    cam.tx = clamp(tx, cam.w - (WORLD.width + APRON.x) * s, APRON.x * s);
    cam.ty = clamp(ty, cam.h - (WORLD.height + APRON.y) * s, APRON.y * s);
    if (snap || reduceMotion.matches) { cam.x = cam.tx; cam.y = cam.ty; }
    paint();
  }
  // Parallax: when the camera moves away from where it rests, the far layers move a little less than the field
  // (none with reduced motion).
  function paint() {
    const x = Math.round(cam.x), y = Math.round(cam.y);
    world.style.setProperty('--cx', `${x}px`);
    world.style.setProperty('--cy', `${y}px`);
    const restX = cam.fitX ? cam.restX : (cam.w - WORLD.width * cam.s) / 2;
    for (const [i, k] of [[0, 0.2], [1, 0.08]]) {
      world.style.setProperty(`--px${i}`, reduceMotion.matches ? '0px' : `${Math.round((restX - x) * k)}px`);
      world.style.setProperty(`--py${i}`, reduceMotion.matches ? '0px' : `${Math.round((cam.restY - y) * k)}px`);
    }
  }
  every(() => {
    if (Math.abs(cam.tx - cam.x) < 0.5 && Math.abs(cam.ty - cam.y) < 0.5) return;
    cam.x += (cam.tx - cam.x) * 0.12;
    cam.y += (cam.ty - cam.y) * 0.12;
    paint();
  });
  addEventListener('resize', fit);
  // the HUD can grow after the fonts load (a second row on narrow phones): the core must still fit under it
  let hudHeight = 0;
  new ResizeObserver(() => { if (hud.offsetHeight !== hudHeight && cam.w) { hudHeight = hud.offsetHeight; fit(); } }).observe(hud);

  // --- HUD: the base and the bases visited ------------------------------------------------

  const showBase = (text) => { hudBase.textContent = text; };
  function arrive(id) {
    if (isProject(id)) visited.add(id);
    saveSession({ visited: [...visited], uniform: load('uniform') });
    paintVisited(id);
    hud.querySelector('.hud-diamonds').title = fill(T.visited, { n: visited.size });
    showBase(id === 'home' && mode === 'bat' ? `${textOf('home', 'label')} · ${T.atBatBase}` : `${textOf(id, 'label')} · ${nameOf(id)}`);
  }

  // The bases visited, on the HUD diamonds and on the scoreboard (also right after a reload: sessionStorage).
  function paintVisited(here = null) {
    scoreLights.forEach((el, i) => el.classList.toggle('is-on', visited.has(RING[i + 1])));
    for (const el of diamonds) {
      const stop = RING[['first', 'second', 'third'].indexOf(el.dataset.corner) + 1];
      el.classList.toggle('is-visited', visited.has(stop));
      el.classList.toggle('is-current', stop === here);
    }
  }

  // Waypoints from one stop to another: along the base path (shortest way round), out of the dugout via home.
  function route(from, to) {
    const ringPath = (a, b) => {
      const i = RING.indexOf(a), j = RING.indexOf(b), n = RING.length;
      const forward = (j - i + n) % n;
      const dir = forward <= n - forward ? 1 : -1;
      const path = [];
      for (let k = i; k !== j; ) { k = (k + dir + n) % n; path.push(RING[k]); }
      return path;
    };
    if (from === to) return [];
    if (from === 'dugout') return ['home', ...ringPath('home', to)];
    return ringPath(from, to);
  }

  // The camera looks at a point (a base with its card) or, without one, follows the runner.
  function camera(point) {
    looking = point;
    aim();
  }

  function showPanel(id) {
    panel.hidden = false;
    for (const card of panel.querySelectorAll('[data-panel]')) card.hidden = card.dataset.panel !== id;
    camera(byId[id] ?? byId[current]);
    // Phones: the card is under the stage (which stays on top): bring it up right under the stage.
    if (!wide.matches) requestAnimationFrame(() => panel.scrollIntoView({ block: 'nearest' }));
  }

  function closePanel({ focus = true } = {}) {
    panel.hidden = true;
    camera(null);
    if (focus) (opener ?? links.find((l) => l.dataset.stop === current)).focus({ preventScroll: true });
  }

  // Phones: the preview is a sheet at the bottom; dragging its top edge down closes it (✕ does the same).
  panel.addEventListener('pointerdown', (event) => {
    if (!event.target.closest('.preview-handle')) return;
    const y0 = event.clientY;
    const move = (e) => { panel.style.translate = `0 ${Math.max(0, e.clientY - y0)}px`; };
    const up = (e) => {
      removeEventListener('pointermove', move);
      removeEventListener('pointerup', up);
      panel.style.translate = '';
      if (e.clientY - y0 > 60) { if (mode === 'tour') { setMode('free'); say(T.tourEnded); } closePanel({ focus: false }); }
    };
    addEventListener('pointermove', move);
    addEventListener('pointerup', up);
  });

  function mark(id) {
    for (const link of field.querySelectorAll('[data-stop]')) {
      if (link.dataset.stop === id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
  }

  // Move the runner to `id`, then show `panelId` (the stop's own panel by default; null = no card). Resolves on arrival.
  function runTo(id, { animate = true, panelId = id } = {}) {
    if (running) running.stop();
    const stops = route(current, id).map((s) => byId[s]);
    current = id;
    mark(id);
    const arrived = () => { arrive(id); if (panelId) showPanel(panelId); };
    if (!animate || reduceMotion.matches || !stops.length) {
      running = null;
      stage.classList.remove('is-running');
      pos = { x: byId[id].x, y: byId[id].y };
      place(pos);
      arrived();
      return Promise.resolve();
    }
    stage.classList.add('is-running');
    return new Promise((resolve) => {
      const tick = (now, dt) => {
        let budget = (SPEED * dt) / 1000;
        while (budget > 0 && stops.length) {
          const target = stops[0];
          const dx = target.x - pos.x, dy = target.y - pos.y;
          const dist = Math.hypot(dx, dy);
          if (dist <= budget) { pos = { x: target.x, y: target.y }; budget -= dist; stops.shift(); }
          else { pos = { x: pos.x + (dx / dist) * budget, y: pos.y + (dy / dist) * budget }; budget = 0; }
          if (dx) runner.classList.toggle('is-flipped', dx < 0);
        }
        place(pos);
        if (!looking) aim();
        if (!stops.length) { running.stop(); running = null; stage.classList.remove('is-running'); arrived(); resolve(); }
      };
      // hurry(): a click or Space while running = there at once (never stuck)
      const finish = () => { const last = stops.at(-1); if (last) { pos = { x: last.x, y: last.y }; stops.length = 0; } tick(performance.now(), 0); };
      running = { stop: every(tick), finish };
      panel.hidden = true; // the preview of the base left behind goes away as the run starts
    });
  }

  // Replace (never add) the history entry, so the address can be shared and one Back press leaves the page.
  const setHash = (id) => { if (location.hash !== `#${id}`) history.replaceState({ stop: id }, '', `#${id}`); };

  // The finale (§ 10): About me with the photo, then Contact & CV. It slides in from the left (at once with reduced motion).
  function showFinale() {
    for (const id of RING) if (isProject(id)) visited.add(id);
    arrive('home');
    showBase(T.tourDone);
    closePanel({ focus: false });
    finale.hidden = false;
    finale.focus({ preventScroll: true });
  }
  function hideFinale() { finale.hidden = true; }

  function focusPreview() {
    if (!keyboardUser) return;
    panel.querySelector('[data-panel]:not([hidden]) .read, [data-panel]:not([hidden]) .button')?.focus({ preventScroll: true });
  }

  const tour = createTour({
    stage, runner, crew, crewAt, byId, nameOf, reduceMotion, sound, sleep, say, setHash, runTo, focusPreview,
    hurry: () => running?.finish(),
    lookAt: (point) => camera(point),
    finale: showFinale,
  });

  // The next base after the one the runner is on (NEXT BASE →, in the preview and in the reader).
  function nextBase() {
    if (mode === 'tour') return tour.next();
    const i = RING.indexOf(current);
    const nextId = RING[(i + 1) % RING.length];
    const step = TOUR.findIndex((s) => s.stop === nextId);
    if (step >= 0 && isProject(current)) { hideFinale(); setMode('tour'); tour.goTo(step); return; }
    go(nextId, { focus: keyboardUser ? 'panel' : 'none' });
  }

  let readerClosedAt = 0;
  const reader = createReader({
    dialog: field.querySelector('dialog.reader'),
    onClose() { readerClosedAt = performance.now(); },
    onNext() { nextBase(); },
  });

  function setMode(next) {
    if (mode === 'bat' && next !== 'bat') batting.stop();
    if (mode === 'tour' && next !== 'tour') tour.stop();
    mode = next;
    field.dataset.mode = next; // CSS: where the bottom bar sits (the uniform bar never covers the runner or the teammates)
    panel.dataset.mode = next; // CSS: in the tour the "Read the case study" link is the quiet button
    pick.hidden = next !== 'pick';
    swingBox.hidden = next !== 'bat';
    for (const [name, row] of Object.entries(rows)) row.hidden = name !== next;
  }

  // Focus left on a button that just got hidden would fall back to the page: move it somewhere useful.
  function refocus(target) {
    const active = document.activeElement;
    if (active === document.body || ((bar.contains(active) || stage.contains(active)) && active.closest('[hidden]'))) target.focus({ preventScroll: true });
  }

  // --- Uniform: the first step, can be skipped (the runner's row of public/game/runner.png) -----------

  const tiles = [...pick.querySelectorAll('[data-uniform]')];
  const dress = (id) => {
    const uniform = UNIFORMS.find((u) => u.id === id) ?? UNIFORMS[0];
    field.style.setProperty('--uniform-row', uniform.row);
    return uniform;
  };
  function wear(id) {
    const uniform = dress(id);
    for (const tile of tiles) tile.setAttribute('aria-pressed', String(tile.dataset.uniform === uniform.id));
    return uniform.id;
  }
  wear(load('uniform'));
  // fix1: pointing at a tile (or focusing it) dresses the runner waiting on deck; leaving the tiles puts the chosen one back.
  for (const tile of tiles) {
    tile.addEventListener('pointerenter', () => dress(tile.dataset.uniform));
    tile.addEventListener('focus', () => dress(tile.dataset.uniform));
  }
  const tileList = pick.querySelector('.uniform-tiles');
  tileList.addEventListener('pointerleave', () => { if (!tileList.contains(document.activeElement)) dress(load('uniform')); });
  tileList.addEventListener('focusout', (event) => { if (!tileList.contains(event.relatedTarget)) dress(load('uniform')); });

  // No focus jump on load: a keyboard visitor starts from the top of the page (skip link, ⏸ Pause, then the tiles).
  // The runner waits on deck, in front of the dugout, fully in view while the visitor chooses.
  function choose() {
    pos = { ...ON_DECK };
    place(pos);
    setMode('pick');
    showBase(`${textOf('home', 'label')} · ${T.atBatBase}`);
  }

  function playBall(uniformId) {
    if (uniformId) save('uniform', wear(uniformId));
    entrance();
    swingButton.focus({ preventScroll: true });
  }

  // --- At bat ---------------------------------------------------------------

  function batUp() {
    setMode('bat');
    say(T.atBat);
    runTo('home', { panelId: null }).then(() => {
      runner.classList.remove('is-walking');
      if (mode !== 'bat') return;
      runner.classList.remove('is-flipped');
      if (!batting.active) batting.start(); // a swing may already be on its way (never start the at-bat twice)
    });
  }

  // The runner walks from the on-deck spot in front of the dugout to home plate, then the pitches start.
  function entrance() {
    batting.stop();
    current = 'dugout'; // not a stop (no link, no card): only where the runner comes from
    pos = { ...ON_DECK };
    place(pos);
    runner.classList.add('is-walking'); // out of the dugout: the walk with the bat on the shoulder
    batUp();
  }

  async function swing() {
    if (mode !== 'bat') return;
    if (!batting.active) {
      // A swing while the runner is still walking out of the dugout: he is at the plate at once, the pitch comes.
      await runTo('home', { animate: false, panelId: null });
      runner.classList.remove('is-flipped');
      batting.start();
    }
    await batting.swing();
    if (mode !== 'bat') return;
    setMode('tour');
    tour.start();
  }

  // --- Free running -----------------------------------------------------------

  function go(id, { focus = 'panel', from = null } = {}) {
    const wasTour = mode === 'tour';
    hideFinale();
    opener = from ?? links.find((l) => l.dataset.stop === id);
    if (mode !== 'free') setMode('free');
    setHash(id);
    const arrived = runTo(id);
    const note = `${wasTour ? `${T.tourEnded} ` : ''}${nameOf(id)}, ${textOf(id, 'label')}.`;
    arrived.then(() => say(note));
    if (focus === 'base') links.find((l) => l.dataset.stop === id).focus();
    else if (focus === 'panel') arrived.then(() => (keyboardUser ? focusPreview() : panel.focus({ preventScroll: true })));
  }

  // Bases on the field and in the "Stadium map" list
  for (const link of field.querySelectorAll('.bases [data-stop], .stadium-map [data-stop]')) {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      go(link.dataset.stop, { from: link });
    });
  }

  // --- Pause menu (a modal <dialog>: the page behind it is inert) ---------------------------

  const readThis = dialog.querySelector('[data-read-this]');
  let beforePause = null;
  function openPause() {
    if (dialog.open) return;
    beforePause = document.activeElement;
    // "Read this project" = the project of the base the runner is on (or the last one visited); none yet = hidden.
    const project = isProject(current) ? current : [...visited].pop();
    readThis.closest('li').hidden = !project;
    if (project) {
      readThis.href = new URL(field.querySelector(`.bases [data-stop="${project}"]`).href).pathname;
      readThis.querySelector('.read-this-name').textContent = nameOf(project);
    }
    if (mode === 'bat') batting.stop(); // nothing goes on behind the menu
    dialog.showModal();
    dialog.querySelector('[data-action="resume"]').focus();
  }
  function closePause() {
    if (!dialog.open) return;
    dialog.close();
    if (mode === 'bat' && !running) batting.start(); // still walking to the plate: the arrival starts the pitches
    (beforePause?.isConnected && beforePause !== document.body ? beforePause : pauseButton).focus({ preventScroll: true });
  }
  // Esc: the dialog would close itself; do it our way (the focus goes back where it was).
  dialog.addEventListener('cancel', (event) => { event.preventDefault(); closePause(); });
  // Tab stays inside the menu: from the last item to the first and back.
  dialog.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    const items = [...dialog.querySelectorAll('a[href], button:not(:disabled)')].filter((el) => !el.closest('[hidden]'));
    const i = items.indexOf(document.activeElement);
    if (event.shiftKey && i <= 0) { event.preventDefault(); items.at(-1).focus(); }
    else if (!event.shiftKey && i === items.length - 1) { event.preventDefault(); items[0].focus(); }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !dialog.open && !reader.open) { event.preventDefault(); openPause(); }
  });

  // --- Controls -----------------------------------------------------------------

  const soundToggles = [...field.querySelectorAll('[data-action="sound"]')];
  const motionToggle = dialog.querySelector('[data-action="motion"]');
  const showToggles = () => {
    for (const toggle of soundToggles) {
      toggle.setAttribute('aria-pressed', String(sound.on));
      toggle.querySelector('.state').textContent = sound.on ? T.on : T.off;
    }
    motionToggle.setAttribute('aria-pressed', String(reduceMotion.matches));
    motionToggle.querySelector('.state').textContent = reduceMotion.matches ? T.on : T.off;
    motionToggle.disabled = systemMotion.matches; // the system setting always wins
    document.documentElement.classList.toggle('reduce-motion', motionOff);
  };

  field.addEventListener('click', (event) => {
    sound.wake();
    const action = event.target.closest('[data-action]')?.dataset.action;
    const uniform = event.target.closest('[data-uniform]')?.dataset.uniform;
    if (uniform) playBall(uniform);
    else if (action === 'skip-uniform') playBall(null);
    else if (action === 'swing') swing();
    else if (action === 'pause') openPause();
    else if (action === 'resume') closePause();
    else if (action === 'next-base') nextBase();
    else if (action === 'read') {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; // a new tab: the real page
      event.preventDefault();
      const link = event.target.closest('[data-action="read"]');
      const id = link.dataset.slug;
      reader.show(link, { label: fill(T.backTo, { base: textOf(id, 'label') }), name: nameOf(id), i: RING.indexOf(id), n: RING.length - 1 });
    }
    else if (action === 'sound') { sound.set(!sound.on); showToggles(); }
    else if (action === 'motion') { motionOff = !motionOff; save('motion', motionOff ? 'reduced' : 'full'); showToggles(); if (motionOff) crowd.still(); else crowd.resume(); aim(true); }
    else if (action === 'close') {
      if (mode === 'tour') { setMode('free'); say(T.tourEnded); }
      closePanel();
    } else if (action === 'free') {
      setMode('free');
      say(T.tourEnded);
      refocus(links.find((l) => l.dataset.stop === current));
    } else if (action === 'again') {
      hideFinale();
      closePanel({ focus: false });
      batUp();
      swingButton.focus({ preventScroll: true });
    } else if (mode === 'bat' && event.target.closest('.stage') && !event.target.closest('.base')) swing();
    else if (mode === 'tour' && event.target.closest('.stage') && !event.target.closest('.base')) tour.skip();
  });

  // Space swings while the field is on screen (not when typing or on another control).
  document.addEventListener('keydown', (event) => {
    if (mode === 'tour' && event.key === ' ' && !dialog.open && !reader.open && !event.target.closest('a, button, input, textarea, select, [contenteditable]')) { event.preventDefault(); tour.skip(); return; }
    if (mode !== 'bat' || dialog.open || event.key !== ' ' || event.target.closest('a, button, input, textarea, select, [contenteditable]')) return;
    const box = stage.getBoundingClientRect();
    if (box.bottom < 0 || box.top > innerHeight) return;
    event.preventDefault();
    sound.wake();
    swing();
  });

  // ← → run from base to base (focus on the field or in the card).
  field.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    if (!event.target.closest('.stage, .panel')) return;
    event.preventDefault();
    if (mode === 'tour' && event.key === 'ArrowRight') { tour.next(); return; }
    const index = STOPS.findIndex((s) => s.id === current);
    const dir = event.key === 'ArrowRight' ? 1 : -1;
    go(STOPS[(index + dir + STOPS.length) % STOPS.length].id, { focus: 'base' });
  });

  // --- Address bar: deep links and Back/Forward -----------------------------------

  const fromHash = () => {
    const id = location.hash.slice(1);
    if (!byId[id]) return false;
    // a base reached by its address: the bases before it on the way count as visited (§ 6)
    for (const stop of RING.slice(1, RING.indexOf(id))) visited.add(stop);
    runTo(id, { animate: false });
    return true;
  };

  // Only other anchors or an address that was typed can add history entries,
  // so Back/Forward here simply means "free mode" at whatever the address says.
  window.addEventListener('popstate', () => {
    if (reader.open || performance.now() - readerClosedAt < 100) return; // Back closed the reader: stay where we are
    const id = location.hash.slice(1);
    if (!id) { if (mode !== 'bat' && mode !== 'pick') { setMode('free'); runTo('home', { animate: false }); } return; }
    if (!byId[id]) { if (mode === 'tour') setMode('free'); return; } // other anchors are not bases
    setMode('free');
    runTo(id, { animate: false });
  });

  // The game is the page: the HUD takes the place of the mode bar (the pause menu leads to the other modes).
  document.documentElement.classList.add('is-game');
  field.querySelector('.no-game').hidden = true;
  for (const el of hud.querySelectorAll('[hidden]')) el.hidden = false;
  showToggles();
  bar.hidden = false;
  if (fromHash()) {
    setMode('free');
    panel.focus({ preventScroll: true });
  } else {
    choose();
  }
  fit();
  paintVisited(isProject(current) ? current : null);
  stage.classList.add('is-ready');
  stage.classList.add('lights-on'); // the four towers light up one after the other
  field.classList.add('is-live'); // CSS: the card goes over the stadium (desktop) only with the game running
}
