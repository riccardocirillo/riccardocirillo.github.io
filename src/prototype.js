// "Try the prototype" (Nipotyno): without JS the preview is a link to a new tab. With JS it has 2 buttons, and the iframe
// exists only after a click (it comes from the <template>), so the page stays light.
// The iframe lives inside a <dialog> shown in the page: showModal() puts that same dialog over everything, without moving the
// iframe (moving one reloads it and loses the visitor's progress). The browser handles Esc, the focus trap and the return of focus.
// The dialog's `cancel` event does not bubble, so Esc here never reaches the reader around it (src/reader.js).
export function initPrototypes(root = document) {
  for (const proto of root.querySelectorAll('.proto')) {
    const actions = proto.querySelector('.proto-actions');
    const loadButton = proto.querySelector('.proto-load');
    const fullButton = proto.querySelector('.proto-full');
    const poster = proto.querySelector('.proto-poster');
    let stage = null;

    const load = () => {
      if (stage) return;
      stage = proto.querySelector('template').content.firstElementChild.cloneNode(true);
      const box = stage.querySelector('.proto-box');
      // Under 900 px the iframe keeps its 1000 × 625 px and is scaled down (src/style.css).
      new ResizeObserver(() => box.style.setProperty('--proto-scale', box.clientWidth / 1000)).observe(box);
      stage.querySelector('.proto-close').addEventListener('click', () => stage.close());
      // In the page it is a plain group; only over the page is it a dialog.
      stage.addEventListener('close', () => stage.setAttribute('role', 'group'));
      poster.replaceWith(stage);
      proto.classList.add('is-loaded');
      loadButton.hidden = true;
    };

    loadButton.addEventListener('click', () => {
      load();
      fullButton.focus({ preventScroll: true }); // the clicked button is gone; the next Tab enters the prototype
    });
    fullButton.addEventListener('click', () => {
      load();
      stage.removeAttribute('role');
      stage.showModal();
    });

    poster.removeAttribute('href');
    poster.querySelector('.proto-newtab').hidden = true;
    actions.hidden = false;
  }
}

initPrototypes();
