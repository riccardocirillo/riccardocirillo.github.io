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
import { FIELD, WORLD, STOPS, RING, CREW, DUGOUT } from './field-map.js';
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
    // HOME RUN on the scoreboard (3 s) and the ola in the stands
    onHomeRun() {
      scoreboard.classList.add('is-home-run');
      setTimeout(() => scoreboard.classList.remove('is-home-run'), 3000);
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

  const place = ({ x, y }) => {
    runner.style.setProperty('--x', `${(Math.round(x) / FIELD.width) * 100}%`);
    runner.style.setProperty('--y', `${(Math.round(y) / FIELD.height) * 100}%`);
  };

  // --- Full screen (v4, ART_BIBLE § 7): whole-number scale that covers the screen, a camera that follows the runner ---
  // Scale: the smallest whole number that covers the screen with the world; phones held upright get 3× (about 130×260
  // world pixels around the runner). Camera: translate() of whole screen pixels, a small delay (lerp), stops at the
  // edges of the world, and keeps the runner clear of the card (left half on wide screens, top part on phones).
  const cam = { x: 0, y: 0, tx: 0, ty: 0, s: 1, w: 0, h: 0 };
  function fit() {
    cam.w = innerWidth; cam.h = innerHeight;
    let s = Math.max(Math.ceil(cam.w / WORLD.width), Math.ceil(cam.h / WORLD.height));
    if (cam.h > cam.w * 1.2) s = Math.max(s, 3);
    cam.s = s;
    field.style.setProperty('--fs', s);
    aim(true);
  }
  function aim(snap = false) {
    const point = looking ?? pos;
    const cardOpen = !panel.hidden;
    const ax = cardOpen && cam.w >= 700 ? cam.w * 0.3 : cam.w * 0.5;
    const ay = cardOpen && cam.w < 700 ? cam.h * 0.3 : cam.h * 0.55;
    const clamp = (v, min) => Math.min(0, Math.max(min, v));
    cam.tx = clamp(ax - point.x * cam.s, cam.w - WORLD.width * cam.s);
    cam.ty = clamp(ay - (point.y - 20) * cam.s, cam.h - WORLD.height * cam.s);
    if (snap || reduceMotion.matches) { cam.x = cam.tx; cam.y = cam.ty; }
    paint();
  }
  // Parallax: the far layers move a little less than the field (none with reduced motion).
  function paint() {
    const x = Math.round(cam.x), y = Math.round(cam.y);
    world.style.setProperty('--cx', `${x}px`);
    world.style.setProperty('--cy', `${y}px`);
    const restX = (cam.w - WORLD.width * cam.s) / 2;
    for (const [i, k] of [[0, 0.2], [1, 0.08]]) {
      world.style.setProperty(`--px${i}`, reduceMotion.matches ? '0px' : `${Math.round((restX - x) * k)}px`);
      world.style.setProperty(`--py${i}`, reduceMotion.matches ? '0px' : `${Math.round(-y * k)}px`);
    }
  }
  every(() => {
    if (Math.abs(cam.tx - cam.x) < 0.5 && Math.abs(cam.ty - cam.y) < 0.5) return;
    cam.x += (cam.tx - cam.x) * 0.12;
    cam.y += (cam.ty - cam.y) * 0.12;
    paint();
  });
  addEventListener('resize', fit);

  // --- HUD: the base and the bases visited ------------------------------------------------

  const showBase = (text) => { hudBase.textContent = text; };
  function arrive(id) {
    if (isProject(id)) visited.add(id);
    saveSession({ visited: [...visited], uniform: load('uniform') });
    scoreLights.forEach((el, i) => el.classList.toggle('is-on', visited.has(RING[i + 1])));
    for (const el of diamonds) {
      const stop = RING[['first', 'second', 'third'].indexOf(el.dataset.corner) + 1];
      el.classList.toggle('is-visited', visited.has(stop));
      el.classList.toggle('is-current', stop === id);
    }
    hud.querySelector('.hud-diamonds').title = fill(T.visited, { n: visited.size });
    showBase(id === 'home' && mode === 'bat' ? `${textOf('home', 'label')} · ${T.atBatBase}` : `${textOf(id, 'label')} · ${nameOf(id)}`);
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
      running = { stop: every(tick) };
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
    lookAt: (point) => camera(point),
    finale: showFinale,
  });

  // The next base after the one the runner is on (NEXT BASE →, in the preview and in the reader).
  function nextBase() {
    if (mode === 'tour') return tour.next();
    const i = RING.indexOf(current);
    go(RING[(i + 1) % RING.length], { focus: keyboardUser ? 'panel' : 'none' });
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
  function wear(id) {
    const uniform = UNIFORMS.find((u) => u.id === id) ?? UNIFORMS[0];
    field.style.setProperty('--uniform-row', uniform.row);
    for (const tile of tiles) tile.setAttribute('aria-pressed', String(tile.dataset.uniform === uniform.id));
    return uniform.id;
  }
  wear(load('uniform'));

  // No focus jump on load: a keyboard visitor starts from the top of the page (skip link, ⏸ Pause, then the tiles).
  function choose() {
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
      if (mode !== 'bat') return;
      runner.classList.remove('is-flipped');
      batting.start();
    });
  }

  // The runner comes out of the dugout and walks to home plate, then the pitches start.
  function entrance() {
    batting.stop();
    current = 'dugout'; // not a stop (no link, no card): only where the runner comes from
    pos = { ...DUGOUT };
    place(pos);
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
    if (mode === 'bat') batting.start();
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
    else if (action === 'motion') { motionOff = !motionOff; save('motion', motionOff ? 'reduced' : 'full'); showToggles(); }
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
  stage.classList.add('is-ready');
  stage.classList.add('lights-on'); // the four towers light up one after the other
  field.classList.add('is-live'); // CSS: the card goes over the stadium (desktop) only with the game running
}
