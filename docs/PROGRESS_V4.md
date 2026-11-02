# PROGRESS v4 — art pass + gioco continuo

Diario dell'esecuzione autonoma di `docs/PROMPT_V4.md` sul ramo `v4` (dal 02/11/2026).
Se il contesto si riempie: rileggi questo file e `docs/ART_BIBLE.md`, poi continua dalla prima cosa non fatta.

## Stato
- Fase attuale: **B · pose chiave**
- Fatto: Fase 0 (commit `v4 0: art bible e prompt`, base di partenza 339/339 test verdi, build ok, node 22.19, sharp 0.35.5)

## Piano (per me, non serve approvazione)
- **A** CLAUDE.md (Read first + regola foto + lavori autonomi) · formato griglie `art/sprites/*.txt` con `--- tag n ms`, `from=`, righe `NN:`, `@part` · `scripts/art/grid.js` (parser + PNG + JSON stile Aseprite, errori file:riga) · `npm run art` = vecchi script + griglie · `/art-lab/` = `art-lab/index.html` servita solo da Vite dev (non in PAGES, test che non è in dist) · `tests/art.spec.js`: palette, pixel isolati sulle griglie (vicini 8, eccezioni in legenda con `!`), mai #000, durate, tremolio per tag, peso PNG · prova: target idle0 → PNG identico pixel per pixel.
- **B** Pose chiave del battitore come griglie, composte da parti disegnate a mano (testa, busto, braccia, gambe) con `@part`; 3 divise = mappe di scambio colore + accessorio con punto di aggancio per frame · 3 giri per posa · porta di qualità B (subagent) · gate-B.png.
- **C** Tutti i frame § 5 (dugout 6, idle 4+1, swing 6, corsa 8, 5 in alto 4, esultanza 3, casa 4) · crew: coach 1ª/3ª, lanciatore, 3 compagni, 8 tifosi 6×10 · nuovi runner/crew sheet + CSS + test · vecchi in `_archive/`.
- **D** Stadio di notte 640×360 (+32) a strati, `src/field-map.js` nuova, `/play/` a tutto schermo con camera e scala intera; titolo e 404 col nuovo stadio.
- **E** HUD con ✕ Exit · anteprima non modale · lettore `<dialog>` con fetch + pushState · momenti sulle basi · finale About me con figurina e foto (`scripts/photo.js`) · `teaser:` nei casi · `/play/#caso` · sessionStorage.
- **F** Effetti home run, fari all'avvio, reduced motion, test Playwright nuovi, Definizione di fatto, porta di qualità F, SPEC v4.

## Diario
- 0 · Controlli iniziali — ok. 339/339 verdi prima di toccare il codice.
- A · Strumenti — grid-parse.js + grid.js, npm run art, /art-lab/ (dev), 6 controlli nuovi in tests/art.spec.js, prova del metodo 0 pixel diversi. 344/344 verdi.

## [CHECK] da guardare

## Problemi aperti
