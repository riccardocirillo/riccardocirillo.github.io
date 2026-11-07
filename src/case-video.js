// Looping videos of a case page: they start the first time they come into view (nothing is downloaded before), once,
// so a pause by the visitor stays a pause. With reduced motion (the system, or the switch of the game's pause menu)
// they stay on the poster, and the controls can start them. The same with the browser's data saver on: nothing is downloaded
// until the visitor asks. Without JS: poster and controls.
export function initCaseVideos(root = document) {
  let motionOff = false;
  try { motionOff = localStorage.getItem('motion') === 'reduced'; } catch {}
  if (motionOff || matchMedia('(prefers-reduced-motion: reduce)').matches || navigator.connection?.saveData) return;
  const start = new IntersectionObserver((entries) => {
    for (const { isIntersecting, target } of entries) {
      if (!isIntersecting) continue;
      start.unobserve(target);
      target.play().catch(() => {}); // the browser said no: poster and controls remain
    }
  });
  for (const video of root.querySelectorAll('video[loop]')) start.observe(video);
}

initCaseVideos();
