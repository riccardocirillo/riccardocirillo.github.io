# PROGRESS v4 — art pass + gioco continuo

Diario dell'esecuzione autonoma di `docs/PROMPT_V4.md` sul ramo `v4` (dal 02/11/2026).
Se il contesto si riempie: rileggi questo file e `docs/ART_BIBLE.md`, poi continua dalla prima cosa non fatta.

## Stato
- Fase attuale: **finita (0 → F) + fix1 (03/11)**. Prossimo passo: Riccardo gioca in locale e decide la pubblicazione (comando in fondo a docs/PROMPT_V4.md).
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

- F · Momenti e prove — effetti dell'home run (pausa d'impatto, flash, scossa, scia, fuochi, ola, HOME RUN), fari all'avvio, polvere e scintilla, tempi esatti del § 5, OG dallo stadio di notte, tests/v4.spec.js. Porta F superata al 3° giro. 374/374 verdi.

## Relazione finale (03/11/2026)
**Fatto per fase**
- 0: controlli, base 339/339 verdi.
- A: griglie di testo → PNG/JSON (scripts/art/grid.js), /art-lab/ solo in dev, 6 controlli automatici, prova del metodo con 0 pixel diversi.
- B: Riccardo a mano in 6 pose chiave × 3 divise; porta B al 3° giro, verdetto "sopra il bersaglio".
- C: 36 frame del § 5 con le durate, coach 1ª/3ª, lanciatore, 3 compagni, 8 tifosi; vecchi fogli in archivio.
- D: stadio di notte a strati (704×424), gioco a tutto schermo con scala intera, camera, parallasse, pubblico vivo, tabellone; titolo e 404 col nuovo stadio.
- E: HUD con ✕ Exit, anteprima della base, lettore nel gioco, momenti sulle basi, finale About me con la figurina e la foto (anche nella Story mode e in Multiplayer), teaser, stato in sessionStorage.
- F: effetti dell'home run, rifinitura, test nuovi, porta F al 3° giro.

**Test:** 374 passati su 374 (all'inizio 339). Nuovi: tests/v4.spec.js (10), tests/photo.spec.js (2), controlli delle griglie in tests/art.spec.js, formati a tutto schermo in tests/field.spec.js.

**Decisioni "(auto)" importanti:** vedi DECISIONS.md 02–03/11. In breve: telefono in verticale a 3×; casa base in modalità libera apre ancora email e CV, il giro finisce sul finale; field.png/night.png in archivio, anche l'OG usa lo stadio di notte; una pulizia automatica dei pixel isolati dopo il montaggio dei frame.

**Prove (Definizione di fatto):** build ok; npm test 374/374; screenshot 1280 e 390 di ogni passo in docs/assets-preview/art-bible/runs/F (d-01…d-09, m-01…m-09); tastiera (Exit primo dopo lo skip link, READ/NEXT/Esc/Indietro testati); contrasto con axe su ogni schermata; reduced motion testato; nessun errore in console nel giro completo. "Online": no, la pubblicazione la decide Riccardo.

### Metodo di lavoro (per ripartire)
- Le griglie si costruiscono nella cartella scratchpad della sessione con: build.mjs (righe da segmenti "y: x:PIXEL"), edit.mjs (modifiche [x,y,"pixel"]), sheet.mjs (monta art/sprites/batter.txt da head.part, *.grid, poses.json, legend.txt e applica il contorno selettivo), anim.mjs + batter.json/coach.json/pitcher.json/mates.json (montaggio con from=, contorno selettivo e pulizia), anchor2.mjs (punti di aggancio), iso.mjs (pixel isolati). Se la sessione è nuova e lo scratchpad è vuoto: si lavora direttamente su art/sprites/*.txt (sono la fonte vera, complete).
- Giro completo con screenshot: W=1280 H=800 TAG=d node --input-type=module < scratchpad/tour.mjs (RUN=E|F)
- Screenshot con Playwright vero (il browser MCP ha zoom 50%): SHOTS="nome|url|w|h|ms" OUT=cartella node --input-type=module < scratchpad/shots.mjs (dev server su 5173).
- Anteprima: node scripts/art/preview.js <foglio> <out.png> [scala] [sfondo].

## fix1 (03/11/2026, dopo la prova di Riccardo)
- 1 · Titolo fluido: base --tf con clamp() (rem + vw/vh), tutto in em; blocco 88vw centrato, colonne 58/38, menu ≥ 9vh. 1280×720: nome, ruolo, date, CV, menu e Nipotyno nel primo schermo; da 768 px di altezza anche le 3 card. Telefono uguale.
- 2 · Stadio intero: il cuore 640×360 (fari → dugout) sempre visibile sotto l'HUD; scala intera più grande che ci sta, frazionaria a passi di 1/48 sotto il 2×; grembiule disegnato (stadium-apron.png) al posto delle zone vuote; camera ferma su desktop, segue solo in orizzontale sul telefono verticale (2×).
- 3 · Omino davanti al dugout durante la scelta della divisa (ON_DECK), ombre in uno strato sotto tutti, ordine per la y dei piedi, barra delle divise lontana da omino e compagni; compagni fermi a braccia giù fino a casa base.
- Test: tests/fix1.spec.js nuovo (titolo a 6 misure, stadio a 9 misure, omino a 9 misure, ordine di disegno, compagni fermi); field.spec.js alla regola nuova. Screenshot prima/dopo in docs/assets-preview/art-bible/runs/fix1/.
- [CHECK] sotto il 2× (1280×720, 1024×768, telefono orizzontale) la scala è frazionaria: su schermi retina non si nota, su un monitor a bassa densità qualche riga di pixel è doppia.

## [CHECK] da guardare
- [CHECK] lanciatore: il guantone nero con il trattino bianco può sembrare una maschera; ombre dei giocatori a scacchi scuri (difetti bassi, porta F).
- [CHECK] mentre l'omino corre tra le basi l'HUD mostra ancora la base di partenza fino all'arrivo (basso).
- [CHECK] Levante: i numeri "~48 h → ~3 h (concept)" e "team of 6" nell'anteprima sono lunghi/senza etichetta (vengono da stats nel contenuto, non li ho cambiati).
- [CHECK] teaser ES/IT da rivedere (CONTENT_STATUS); stringhe v4 ES/IT in src/i18n.js.
- [CHECK] salto a casa: braccia ancora lunghe e sottili, busto 15 px contro 18 delle altre pose (difetto basso della revisione).
- [CHECK] camminata: a 1× somiglia ancora alla posa di attesa (mazza in diagonale, gambe ad A).
- [CHECK] swing: la gomitiera è sul gomito dietro (accettabile secondo il revisore).

## Problemi aperti
- (risolto 03/11) push del ramo v4: riuscito con fix1, il ramo è su GitHub (origin/v4). Nessun merge in main.

## 06/11/2026 · Casi, parte 1 (Nipotyno + PDF)
- A · PDF dei casi tolti da pagine, lettore, build e test. CV intatti.
- B · Prima/dopo del pagamento nella sezione Prototype.
- C · Prototipo hi-fi caricato al clic, con schermo intero sulla stessa pagina, anche dentro il lettore del gioco. Test in tests/nipotyno-prototype.spec.js (con un sito finto al posto di quello vero, così CI non dipende dalla rete).
- D · Test: nuovo testo, schema delle fasi in HTML, facsimile tolto. Sulla pagina del caso la scheda giocatore sticky si ferma prima della sezione Test.
- E · Corretto sinistra/destra.
- Screenshot in docs/screens/2026-11-06/ (non nel repo).
- [CHECK] con il focus dentro il prototipo Esc non chiude: serve il pulsante Chiudi (limite del browser con un dominio esterno).
- [CHECK] i 3 punti di testo in CONTENT_STATUS.
