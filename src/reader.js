// The reader inside the game (v4, docs/ART_BIBLE.md § 9): READ on a base opens the real case page in a full-screen
// <dialog> (paper theme), over the stadium. Same text, same images, one place to update: we fetch the page and take its <main>.
// The address becomes the page's (history.pushState): a reload opens the real static page, and Back closes the reader
// (the address goes back to /play/#<case>). Esc and the two "Back" buttons do the same. If fetch fails: the real page.
import { initPrototypes } from './prototype.js';

export function createReader({ dialog, onClose, onNext }) {
  const body = dialog.querySelector('.reader-body');
  const backText = dialog.querySelector('.reader-back-text');
  const count = dialog.querySelector('.reader-count');
  const loading = body.innerHTML;
  const cache = new Map();
  let current = null; // { slug, href }
  let opener = null;
  let then = null; // what to do once the reader is really closed (after Back has put the address back)

  async function load(href) {
    if (!cache.has(href)) {
      cache.set(href, fetch(href).then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.text();
      }).then((html) => new DOMParser().parseFromString(html, 'text/html').querySelector('main')));
    }
    return cache.get(href);
  }

  function shut() {
    if (!dialog.open) return;
    for (const inner of dialog.querySelectorAll('dialog[open]')) inner.close(); // Back while the prototype is full screen
    dialog.close();
    const was = current;
    current = null;
    onClose?.(was);
    const after = then;
    then = null;
    if (after) after(was);
    else (opener?.isConnected ? opener : null)?.focus({ preventScroll: true });
  }

  // Back (browser) or the reader's own buttons: the history entry we added goes away, then the dialog closes.
  addEventListener('popstate', () => { if (dialog.open && !history.state?.reader) shut(); });
  const leave = () => { if (history.state?.reader) history.back(); else shut(); };
  dialog.addEventListener('cancel', (event) => { event.preventDefault(); leave(); });
  dialog.addEventListener('click', (event) => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'reader-close') leave();
    if (action === 'reader-next') {
      then = (was) => onNext?.(was);
      leave();
    }
  });

  return {
    get open() { return dialog.open; },
    // link = the READ link of the base preview; label = "1st base"; i / n = "1 / 3".
    async show(link, { label, name, i, n }) {
      const href = new URL(link.href).pathname;
      opener = link;
      current = { slug: link.dataset.slug, href };
      dialog.setAttribute('aria-label', name);
      backText.textContent = label;
      count.textContent = `${i} / ${n}`;
      body.innerHTML = loading;
      dialog.showModal();
      history.pushState({ reader: current.slug }, '', href);
      dialog.querySelector('.reader-back').focus();
      try {
        const main = await load(href);
        if (!main) throw new Error('no <main>');
        if (current?.href !== href) return; // closed or replaced in the meantime
        body.replaceChildren(...[...main.children].map((el) => document.importNode(el, true)));
        initPrototypes(body);
        body.scrollTop = 0;
      } catch {
        location.href = href; // the real page, a normal change of page
      }
    },
    close: leave,
  };
}
