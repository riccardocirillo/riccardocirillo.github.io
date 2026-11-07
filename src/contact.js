// A click on the email copies the address and says so for about 2 s, on screen and to screen readers (.copy-toast is a
// live region). Without JS, without the Clipboard API, or if the browser refuses, it stays a normal mailto.
const toast = document.querySelector('.copy-toast');
if (toast && navigator.clipboard) {
  for (const link of document.querySelectorAll('a[data-copy]')) {
    link.classList.add('can-copy');
    link.querySelector('.copy-tag').hidden = false;
  }
  let timer;
  document.addEventListener('click', async (event) => {
    const link = event.target.closest('a[data-copy]');
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    try {
      await navigator.clipboard.writeText(link.href.replace('mailto:', ''));
    } catch {
      location.href = link.href;
      return;
    }
    toast.textContent = toast.dataset.copied;
    clearTimeout(timer);
    timer = setTimeout(() => { toast.textContent = ''; }, 2000);
  });
}
