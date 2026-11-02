# PROGRESS v4 — art pass + gioco continuo

Diario dell'esecuzione autonoma di `docs/PROMPT_V4.md` sul ramo `v4` (dal 02/11/2026).
Se il contesto si riempie: rileggi questo file e `docs/ART_BIBLE.md`, poi continua dalla prima cosa non fatta.

## Stato
- Fase attuale: **F · momenti, rifinitura, test, porta di qualità F**
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

- B · Pose chiave (in corso) — art/sprites/batter.txt: idle, swing (contatto), corsa (contatto), 5 in alto (contatto), salto a casa, camminata con mazza in spalla × 3 divise (navy+lente, rosso+matita, grigio+chiave). 3 giri: bersaglio corretto (13 pixel isolati, mento, mazza, logo, orecchino), corsa v1→v3, swing v1→v2 (mazza lunga, corpo spostato a sinistra), salto v1→v3. Foglio docs/assets-preview/art-bible/gate-B.png. Revisione indipendente in corso.
- (anticipo E) scripts/photo.js: foto 4:5 640/320 WebP senza metadati (verificato con sharp).
- Strumenti per disegnare: scripts/art/preview.js (foglio a N× + silhouette + grigi).

- B · revisione 1 (subagent): 3 alti + 7 medi + 4 bassi, verdetto "sotto il bersaglio". Corretti: mani divise e avambraccio davanti al petto (idle), mazza 17 px rastremata con pomello + fianchi ruotati + piede dietro in punta (swing), luce dcba (5 in alto), logo e gomitiera in tutte le pose, scarpe dietro a cuneo, braccio a L (corsa), camminata più stretta con guanto alla spalla, contorno selettivo automatico (1→2, G→g, a→b, t→u sul lato in alto a sinistra), paraorecchie + ricci a ciuffi + barba 'h', accessori con contorno scuro. Revisione 2: 1 alto + 3 medi, "pari"; corretti (braccio davanti della corsa, gomitiere 3×2, bordo maglia, avambraccio dietro). Revisione 3: solo bassi, verdetto "sopra il bersaglio". **Porta B superata.** 356/356 verdi. Foglio gate-B.png.
- (anticipo C) art/sprites/fans.txt: 8 tifosi 6×10, fermo/braccio su. art/sprites/coach.txt: coach con cappellino, giacca a vento, barba; variante 3ª con barba grigia (solo frame idle per ora).

- C · Animazioni complete — runner.txt 36 frame (§ 5, durate nel JSON), coach 12×2, pitcher 6, mates 5×3, fans 8×2. 0 pixel isolati in tutte le varianti (pulizia automatica + punti di aggancio cercati). runner/crew v3 in archivio, CSS/OG/test aggiornati. 361/361 verdi.

- D · Stadio e schermo intero — scripts/art/stadium.js (strati), field-map v4 (704×424), /play/ a tutto schermo con scala intera, camera, parallasse, aloni che si accendono, tabellone vivo, pubblico su canvas; titolo e 404 con stadium.png. 354/354 verdi. Screenshot in runs/D.

- E · Percorso — HUD con ✕ Exit, anteprima (aside, destra/basso, maniglia), lettore src/reader.js, momenti in src/tour.js, finale con figurina e foto (scripts/photo.js), teaser nei 9 file, sessionStorage. Test del vecchio flusso aggiornati, tests/photo.spec.js nuovo. 356/356 verdi. Screenshot del giro in runs/E (d-*, m-*).

### Metodo di lavoro (per ripartire)
- Le griglie si costruiscono nella cartella scratchpad della sessione con: build.mjs (righe da segmenti "y: x:PIXEL"), edit.mjs (modifiche [x,y,"pixel"]), sheet.mjs (monta art/sprites/batter.txt da head.part, *.grid, poses.json, legend.txt e applica il contorno selettivo), anim.mjs + batter.json/coach.json/pitcher.json/mates.json (montaggio con from=, contorno selettivo e pulizia), anchor2.mjs (punti di aggancio), iso.mjs (pixel isolati). Se la sessione è nuova e lo scratchpad è vuoto: si lavora direttamente su art/sprites/*.txt (sono la fonte vera, complete).
- Giro completo con screenshot: W=1280 H=800 TAG=d node --input-type=module < scratchpad/tour.mjs (RUN=E|F)
- Screenshot con Playwright vero (il browser MCP ha zoom 50%): SHOTS="nome|url|w|h|ms" OUT=cartella node --input-type=module < scratchpad/shots.mjs (dev server su 5173).
- Anteprima: node scripts/art/preview.js <foglio> <out.png> [scala] [sfondo].

## [CHECK] da guardare
- [CHECK] salto a casa: braccia ancora lunghe e sottili, busto 15 px contro 18 delle altre pose (difetto basso della revisione).
- [CHECK] camminata: a 1× somiglia ancora alla posa di attesa (mazza in diagonale, gambe ad A).
- [CHECK] swing: la gomitiera è sul gomito dietro (accettabile secondo il revisore).

## Problemi aperti
- push del ramo v4 dopo A: "Failed to connect to github.com port 443" (rete). Riprovo alla fine di ogni fase.
