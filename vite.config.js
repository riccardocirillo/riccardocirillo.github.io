import { defineConfig } from 'vite';
import { rm } from 'node:fs/promises';
import { generate, PAGES } from './scripts/pages.js';

// Build the HTML pages from content/*.md before Vite starts (dev and build).
await generate();

// In `npm run dev`, regenerate the pages and reload the browser when a content file changes.
const contentWatcher = {
  name: 'content-pages',
  configureServer(server) {
    server.watcher.add('content');
    server.watcher.on('change', async (file) => {
      if (!/content\/.+\.md$/.test(file)) return;
      await generate();
      server.ws.send({ type: 'full-reload' });
    });
  },
};

// v4: old sprites and pictures live in public/_archive/ (for the before/after of /art-lab/), never in the site.
// /art-lab/ itself is not in PAGES, so it is never built (tests/art.spec.js checks both).
const dropArchive = {
  name: 'drop-archive',
  apply: 'build',
  async closeBundle() { await rm(new URL('./dist/_archive', import.meta.url), { recursive: true, force: true }); },
};

// User site (ricccardo15.github.io) is served from the domain root, so base = '/'.
export default defineConfig({
  base: '/',
  plugins: [contentWatcher, dropArchive],
  build: {
    outDir: 'dist',
    rollupOptions: { input: PAGES },
  },
});
