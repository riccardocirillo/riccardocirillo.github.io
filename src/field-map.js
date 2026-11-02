// Shared map of the ballpark, in world pixels (v4, docs/ART_BIBLE.md § 7 and § 11): the night stadium is 640×360
// plus a 32 px margin on every side, so the world is 704×424 (everything drawn).
// Used by scripts/art/stadium.js (draws the layers), scripts/pages.js (places the base links) and src/game.js
// (moves the runner, the camera). Change a position here and everything follows.
export const WORLD = { width: 704, height: 424, margin: 32 };
export const FIELD = WORLD; // the base links and the sprites are placed in % of this box
export const FIELD_TOP = 178; // first row of the field layer under the wall and the track (the sky layer stops here)
export const TOWERS = [{ x: 102, y: 50 }, { x: 237, y: 42 }, { x: 467, y: 42 }, { x: 602, y: 50 }]; // top-left of each lamp head
export const SCOREBOARD = { x: 302, y: 72, w: 100, h: 40 };

// Stops in keyboard order (← →). `id` = case page slug (/nipotyno/); home plate = Multiplayer, Contact & CV (F5).
// `tag` = where the label sits, so it never hides the runner standing on the base (or the pitcher): below / right / above.
export const STOPS = [
  { id: 'home', x: 352, y: 364, label: 'Home plate', name: 'Contact & CV', tag: 'right' },
  { id: 'nipotyno', x: 444, y: 282, label: '1st base', name: 'Nipotyno', tag: 'below' },
  { id: 'levante', x: 352, y: 202, label: '2nd base', name: 'Levante', tag: 'right' },
  { id: 'sensor-lab', x: 260, y: 282, label: '3rd base', name: 'Sensor lab', tag: 'below' },
];

// The dugout is only scenery (F1): the runner comes out of it when the visitor enters the ballpark (src/game.js).
// x/y = the middle of its front edge (the roof is a layer of its own, in front of the players).
export const DUGOUT = { x: 162, y: 372 };

// The scoreboard, the pitcher's mound and the ticket booth: clickable in Fase 2, scenery since F5 (less to read in the game).
// Kept here because their icons follow the 4 of STOPS in public/game/icons.png (scripts/art/icons.js).
export const SPOTS = [
  { id: 'about', x: 352, y: 92, label: 'Scoreboard', name: 'About', tag: 'below', href: '#about' },
  { id: 'how', x: 352, y: 286, label: "Pitcher's mound", name: 'How I design', tag: 'upleft', href: '#how' },
  { id: 'contact', x: 470, y: 160, label: 'Ticket booth', name: 'Contact & CV', tag: 'below', href: '#contact' },
];

// The runner follows the base path (home → 1st → 2nd → 3rd → home).
export const RING = ['home', 'nipotyno', 'levante', 'sensor-lab'];

// People on the field. x/y = feet, in field pixels. `who` = the sheet (public/game/<who>.png, drawn in art/sprites/<who>.txt),
// `row` = the variant row of that sheet (coach: 0 first, 1 third; mates: 0 A, 1 B, 2 C). `flip` = faces left.
// Teammates stand in front of the dugout; at home plate they jump with their arms up.
export const CREW = [
  { id: 'coach1', who: 'coach', row: 0, x: 478, y: 290, flip: true }, // hand meets the runner's on 1st
  { id: 'coach3', who: 'coach', row: 1, x: 226, y: 290 }, // and on 3rd
  { id: 'pitcher', who: 'pitcher', row: 0, x: 352, y: 287, flip: true },
  { id: 'mateA', who: 'mates', row: 0, x: 120, y: 396 },
  { id: 'mateB', who: 'mates', row: 1, x: 162, y: 398, flip: true },
  { id: 'mateC', who: 'mates', row: 2, x: 204, y: 396, flip: true },
];

// The home-run tour: one stop per project, each with a small moment (src/tour.js), then the last card.
// `moment` = runner animation, `with` = who joins in (crew ids) and how, `corner` = the corner of the tour diamond.
// The tour never moves on by itself: the visitor presses Next in the card.
export const TOUR = [
  { stop: 'nipotyno', corner: 'first', moment: 'highfive', with: { coach1: 'highfive' } },
  { stop: 'levante', corner: 'second', moment: 'cheer', with: {} },
  { stop: 'sensor-lab', corner: 'third', moment: 'highfive', with: { coach3: 'highfive' } },
  { stop: 'home', corner: 'home', panel: 'done' }, // back on home plate, last card: CV, email, take another swing
];
