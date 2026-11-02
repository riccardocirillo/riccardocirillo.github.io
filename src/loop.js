// One requestAnimationFrame for the whole game (docs/ART_BIBLE.md § 13): the runner, the camera, the ball, the crowd.
// every(fn) adds fn(now, dt) to the loop and returns a function that removes it. The loop stops when nothing is left.
const tasks = new Set();
let frame = null;
let last = 0;

function tick(now) {
  const dt = last ? Math.min(now - last, 100) : 16;
  last = now;
  for (const fn of [...tasks]) fn(now, dt);
  frame = tasks.size ? requestAnimationFrame(tick) : null;
  if (!frame) last = 0;
}

export function every(fn) {
  tasks.add(fn);
  if (!frame) frame = requestAnimationFrame(tick);
  return () => tasks.delete(fn);
}
