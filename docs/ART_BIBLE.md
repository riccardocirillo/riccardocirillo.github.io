# Art bible v4 — personaggi, stadio e percorso di gioco

Deciso con Riccardo il 02/11/2026. Fonte visiva: canvas Claude Design "Portfolio · Art bible & game flow".
Le tavole in PNG e i bersagli di qualità stanno in `docs/assets-preview/art-bible/` (privata, mai nel repo).
Questo file è la fonte di verità per la v4. Se contraddice `docs/archive/PROMPT_V3.md` o `docs/SPEC.md`, vale questo file; scrivi la decisione in `docs/DECISIONS.md`.

## 0. Decisioni (02/11)
1. **Pixel a mano.** I personaggi non si disegnano più con forme geometriche (`ellipse`, `rect`). Ogni frame è una griglia di testo (un carattere = un colore della palette) e uno script la converte in PNG.
2. **Loop di correzione automatico** su una pagina di anteprima solo locale (`/art-lab/`). Esecuzione autonoma: al posto delle approvazioni ci sono 2 porte di qualità automatiche (pose chiave, poi giro completo) con controlli e un revisore indipendente (vedi `docs/PROMPT_V4.md`).
3. **Stadio di notte vivo**, stessa vista dall'alto di oggi. Il gioco riempie tutto lo schermo su ogni dispositivo, senza "finestra"; una camera segue l'omino.
4. **Gioco continuo:** un solo swing (home run), poi base per base. In 1ª e 3ª il 5 in alto con il coach, in 2ª la corsa continua con un'esultanza. Su ogni base c'è un'anteprima veloce del caso, un lettore dentro il gioco e l'uscita sempre visibile.
5. **Finale dopo casa base:** About me con la **foto vera** di Riccardo dentro una figurina da baseball, poi l'uscita consigliata Contact & CV. Il busto in pixel art è scartato: la conversione dalla foto non era all'altezza.
6. Arte 100% originale, niente AI per le immagini, niente sprite di altri giochi. Reduced motion sempre rispettato. Il sito funziona sempre senza JS e senza gioco.

## 1. Formato dei pixel e strumenti
- **Griglie:** `art/sprites/<nome>.txt`. In testa ci sono `size: 48x48`, la legenda `palette:` (carattere → nome del colore in `src/palette.js`) e i `tags:` (nome, da–a). Poi un blocco per frame: `--- <tag> <n> <ms>` seguito da 48 righe di 48 caratteri. `.` = trasparente.
- Le **divise** sono mappe di scambio colore definite una volta sola (navy → rosso, navy → grigio). Gli accessori (lente, matita, chiave) sono piccole griglie a parte, sovrapposte a un punto di aggancio indicato per ogni frame.
- **Script:** `scripts/art/grid.js` legge le griglie e scrive `public/game/<sheet>.png` + `<sheet>.json` (frame, durata in ms, tag: formato simile all'export JSON di Aseprite). Usa `sharp` (già installato). `npm run art` rigenera tutto.
- Gli **sfondi grandi** (stadio, pubblico) possono restare in codice (`scripts/art/*.js`), ma con le tecniche del § 11. Il rumore casuale è vietato.
- **`/art-lab/`** (solo `npm run dev`, esclusa dalla build e da `PAGES`): mostra ogni frame a 8× con la griglia, l'animazione a velocità reale con le durate del JSON, la sovrapposizione col frame precedente (onion skin), il prima/dopo, la prova silhouette (tutto in un colore su carta) e la prova in grigi. Ci sono anche i 3 tagli della camera (desktop, tablet, telefono).
- **Controlli automatici** (`tests/art.spec.js` o uno script):
  - solo colori della palette;
  - nessun pixel isolato (un pixel senza vicini dello stesso colore, tranne occhi e riflessi segnati nella legenda);
  - contorni mai `#000`;
  - ogni frame ha una durata;
  - "tremolio": tra due frame della stessa animazione cambiano al massimo i pixel attesi (soglia per tag);
  - peso dei PNG.
- **Loop:** disegna → `npm run art` → screenshot di `/art-lab/` con Playwright MCP → guarda → correggi. Almeno 3 giri per posa chiave prima della porta di qualità.

## 2. Regole dei pixel
- Luce da in alto a sinistra, per tutto.
- Contorno selettivo: il tono più scuro della rampa del materiale, mai il nero puro. Un tono più chiaro dal lato della luce.
- Per materiale al massimo 3 toni più 1 luce. Le ombre vanno verso il blu o il viola, le luci verso il giallo (rampe di `src/palette.js`).
- Anti-aliasing manuale solo sulle curve (casco, testa, mazza). Niente "pillow shading" (l'ombra disegnata uguale tutto intorno al bordo).
- Le linee in diagonale hanno passi regolari (1-1, 1-2, 2-2), senza scalini casuali.
- Ogni frame passa la prova silhouette e quella in grigi: casco, maglia, pelle e pantaloni restano distinguibili.
- Si possono aggiungere colori alla palette solo se servono davvero (massimo 8). Ogni aggiunta va in `src/palette.js` e nei test.

## 3. Riccardo (battitore) — frame 48×48, piedi sulla riga 46
- Bersaglio: `targets/batter_idle0_48.png`. Superarlo, non copiarlo: mento, mani e torsione del busto vanno rifiniti.
- Figura alta circa 44 px, testa con casco circa 18 px (un po' chibi ma leggibile).
- Tratti presi dalle foto private, descritti qui:
  - casco navy con paraorecchie;
  - ricci scuri sulla nuca;
  - sopracciglia folte, occhi castani, barba corta;
  - piccolo orecchino ad anello;
  - maglia navy con logo piccolo, pantaloni bianchi;
  - guanti da battuta bianchi, polsini neri;
  - protezione bianca sul gomito davanti;
  - scarpe scure.
- Posa di battuta (dalla foto in battuta): gambe larghe, ginocchia piegate, peso in avanti, mazza alta dietro la testa.
- Le 3 divise sono scambi di palette con accessorio: Researcher navy + lente, Designer rosso + matita, Maker grigio + chiave. Restano gli id di `src/uniforms.js`. **07/11/2026:** nel gioco si parte sempre con Researcher, la scelta non c'è più; le altre righe restano nel foglio.
- Animazioni: vedi § 5.

## 4. Crew e pubblico
- **Coach 1ª base:** divisa rossa, cappellino, giacca a vento, guarda a sinistra. Idle 4 frame (braccia conserte, batte il piede), 5 in alto 3, applauso 2.
- **Coach 3ª base:** stesso modello con altra faccia e barba grigia, guarda a destra. Gesto "vai a casa" (3 frame) prima del 5 in alto.
- **Lanciatore:** divisa grigia avversaria. Caricamento con la gamba alta e lancio in 5 frame, poi si gira a guardare la palla (1 frame).
- **Compagni ×3:** navy, con 3 teste diverse. Davanti al dugout, fermi in piedi con le braccia giù (frame idle); a casa base saltano a braccia alzate (4 frame).
- **Pubblico:**
  - 8 tifosi diversi da 6×10 px, 2 frame (fermi / braccia su);
  - file con scarto fisso (seed). La fila alta è più scura, la fila bassa più chiara;
  - stanno in un `<canvas>` sopra le tribune, aggiornato a 8 fps;
  - da fermo: 1 tifoso su 12 cambia frame ogni 1–2 s;
  - home run: "ola" che attraversa le tribune in 1,5 s, più flash dei telefoni;
  - reduced motion: tutto fermo, niente flash.

## 5. Animazioni e tempi (ms per frame, nel JSON)
| Animazione | Frame | Pose e tempi | Reduced motion |
|---|---|---|---|
| Uscita dal dugout | 6 | camminata con mazza in spalla, 6 × 100 | già al piatto |
| Attesa al piatto | 4 + 1 | respiro 1 px, mazza che oscilla, 4 × 180; battito di ciglia ogni 3 s | frame 0 fermo |
| Swing | 6 | carica 120 · passo 80 · smear 40 · contatto 60 + pausa d'impatto 120 · accompagnamento 100 · posa finale 300 | posa finale |
| Corsa | 8 | contatto, giù, passaggio, su (×2), 8 × 70; polvere 3 frame | appare sulla base |
| 5 in alto (1ª, 3ª) | 4 | avvicina 100 · braccio su 100 · contatto 140 + scintilla 2 frame · stacca 120 | frame del contatto |
| Esultanza (2ª) | 3 | pugno in alto senza fermarsi, 3 × 110 | nessuna |
| Arrivo a casa | 4 | salto sul piatto 4 × 100, compagni che saltano | frame del salto |
| Effetti | — | scia della palla 6 · fuochi 8 frame × 3 colpi · flash 2 · scossa 2 px × 3 · HOME RUN sul tabellone max 3 s | tutti spenti |

Prima si disegnano le pose chiave (porta di qualità B), poi i frame in mezzo. Lo smear è un frame "sbavato" della mazza; la pausa d'impatto è un fermo di 120 ms sul contatto.

## 6. Percorso di gioco (`/play/`)
1. **Gameplay:** dalla schermata titolo. Lo stadio si accende a tutto schermo: i fari uno dopo l'altro, il pubblico si alza.
2. **Divisa:** 3 tessere in una riga in basso, saltabile, ricordata. Clic, ← → o Skip.
3. **Swing!:** esce dal dugout e si mette in posa. Un solo swing (Spazio, clic o tap) e parte l'home run con scia, fuochi, ola e tabellone.
4. **1ª base:** 5 in alto al coach, poi l'anteprima di Nipotyno (§ 8).
5. **Read:** apre il lettore nel gioco (§ 9). Chiudendolo si torna sulla stessa base.
6. **2ª base:** corsa continua con il pugno in alto, poi l'anteprima di Levante.
7. **3ª base:** il coach gira il braccio ("vai!"), 5 in alto, poi l'anteprima di Sensor lab.
8. **Casa base:** salto sul piatto, compagni a braccia alzate, la camera stringe sul gruppo.
9. **About me:** la figurina con la foto (§ 10), uscita consigliata Contact & CV, poi Story mode o Play again.

Regole:
- **Mai bloccati.** Ogni animazione si salta con Spazio o un clic, nessuna attesa forzata oltre 2 s.
- **Mai automatico.** Si passa alla base dopo solo con "Next base" o →.
- **Uscita sempre visibile.** ✕ Exit nell'HUD porta alla schermata titolo, ed è il primo elemento focalizzabile dopo il link "salta al contenuto". La pausa (Esc / ⏸) resta com'è oggi.
- **HUD in una riga:** ✕ Exit · ⏸ Pause · Esc · base attuale · ◆◇◇ · ♪.
- **Indirizzi e Indietro:** `/play/#nipotyno` (`#levante`, `#sensor-lab`) apre il gioco su quella base già raggiunta. Il tasto Indietro del browser chiude il lettore. Lo stato (basi visitate, divisa) va in `sessionStorage`, dentro try/catch.
- **Senza JS:** le basi restano link veri alle pagine dei casi; casa base → `/multiplayer/`.

## 7. Schermo intero e camera
- `/play/` con JS: il gioco occupa `100dvw × 100dvh`, senza bordi, senza scroll della pagina e senza cornice intorno al campo.
- **Mondo** 640×360 più un margine di 32 px per lato (704×424), disegnato tutto. Le coordinate delle basi stanno in `src/field-map.js` (aggiornalo; le basi ora sono più al centro e in basso, vedi `targets/night_target_640x360.png`).
- **Cuore** (fix1, 03/11): `CORE` = 640×360 da x 32, y 40 (dalla cima dei fari fino a casa base, al dugout e ai piedi dei compagni). Su desktop, tablet e telefono orizzontale si vede **sempre tutto il cuore**, sotto l'HUD.
- **Grembiule** (fix1): `APRON` = altro stadio disegnato intorno al mondo, 288 px ai lati e 176 sopra e sotto (`public/game/stadium-apron.png`, 1280×776, vuoto dove c'è il mondo): cielo con stelle sopra, skyline, tribune con tifosi e muro ai lati, prato a scacchi sotto. Lo spazio in più non resta mai vuoto, anche a 21:9 e 4:3. Mai bande nere.
- **Scala** (fix1): la più grande intera con cui il cuore sta nello schermo sotto l'HUD (`floor(min(larghezza / 640, (altezza − HUD) / 360))`). Sotto il 2× (portatili 1280×720, telefono orizzontale) e solo dove il grembiule lascerebbe un vuoto si passa a una scala frazionaria a passi di 1/48 (una cella di sprite resta di pixel interi), sempre nearest-neighbor. Telefono verticale (altezza > 1,2 × larghezza): 2×, tutta l'altezza dello stadio. Mai sfocato: `image-rendering: pixelated`.
- **Camera:** un contenitore del mondo con `transform: translate()` di valori interi (in px dello schermo), con un piccolo ritardo (lerp). Parte con lo stadio intero inquadrato (il cuore al centro, sotto l'HUD) e **segue l'omino solo dove il cuore non sta già tutto nello schermo** (telefono verticale: solo in orizzontale). Si ferma ai bordi del grembiule. Lascia libera la zona coperta dall'anteprima: su desktop sposta lo stadio a sinistra solo quanto basta perché la base e il suo coach non finiscano sotto la scheda; su telefono alza lo stadio sopra il pannello in basso.
- **Tagli** (vedi la tavola Stadium):
  - desktop, tablet 4:3, 21:9 e telefono orizzontale = tutto il cuore, più il grembiule intorno;
  - telefono verticale = tutta l'altezza a 2× (circa 195 px di mondo in larghezza), la camera segue l'omino in orizzontale.
- I link delle basi sono `<a>` dentro il mondo e si muovono con la camera. Bersagli ≥ 44 px, focus visibile.
- Parallasse leggera sugli strati lontani quando la camera si muove (spenta con reduced motion).
- **Ordine di disegno** (fix1): i personaggi si ordinano per la y dei piedi (`z-index` = 100 + y); il tetto del dugout copre solo chi ha i piedi dietro la sua linea (`ROOF_LINE`). Le ombre sono uno strato sotto tutti i personaggi, mai sopra una testa. Le etichette delle basi stanno sopra tutti.
- **Scelta della divisa** (fix1): l'omino aspetta davanti al dugout, sull'erba (`ON_DECK`), tutto visibile e lontano da tetto, compagni ed etichette; passando su una divisa cambia lì. La barra delle divise non copre mai l'omino né i compagni: in basso a destra su desktop, una scheda stretta a destra su 4:3 e telefono orizzontale, sul prato sotto il muro sul telefono verticale.

## 8. Anteprima della base (non modale)
- **Contenuto:**
  - etichetta "01 · 1ST BASE", titolo del caso in Jersey 10, una riga dal frontmatter `description` (accorciata a mano in `content/*.md` come `teaser:`, EN/ES/IT, ES/IT [CHECK]);
  - 3 numeri da `stats`, copertina;
  - **READ ▶** (primario giallo) e **NEXT BASE →**; sotto, una riga piccola con ruolo · team · date;
  - ✕ chiude.
- **Desktop:** pannello a destra di 380 px, il campo resta visibile e cliccabile. **Telefono:** pannello in basso di circa 40% dell'altezza, con maniglia; si chiude anche trascinandolo giù.
- È un `<aside>` con titolo, annunciato con `aria-live="polite"`. Non intrappola il focus; il focus va su READ solo se il visitatore usa la tastiera.
- Entra in 150 ms (slide, senza dissolvenza del testo, contrasto pieno a ogni frame). Con reduced motion appare subito.

## 9. Lettore dentro il gioco
- READ apre un pannello a tutto schermo sopra lo stadio, tema **paper**. Il contenuto si carica con `fetch()` dalla pagina vera (`/nipotyno/` ecc.): si prende `<main>` e i suoi link funzionano. Stesso testo, stesse immagini, un solo posto da aggiornare.
- È un `<dialog>` modale (focus intrappolato, Esc chiude). `history.pushState` porta l'indirizzo a `/nipotyno/`: se si ricarica, si apre la pagina statica vera. Indietro chiude il lettore e torna a `/play/#nipotyno`.
- Barra in alto: **◀ BACK TO 1ST BASE** e "1 / 3". In fondo: **◀ BACK TO GAME** e **NEXT BASE →** (chiude e corre alla base dopo).
- Se `fetch` fallisce si va alla pagina vera, con un normale cambio di pagina.

## 10. Finale About me e figurina con la foto
- Testi solo da `content/about.md`: il paragrafo "Hi, I'm Riccardo", il motto e la riga sulla ricerca del tirocinio. Nessun testo nuovo.
- **Figurina:**
  - cornice carta `#f6f2ea`, bordo inchiostro 2 px, ombra rossa piena 8 px;
  - barra navy "PLAYER PROFILE";
  - foto 4:5, nome RICCARDO CIRILLO in Jersey 10 con ombra gialla.
- **Foto:**
  - fonte `docs/reference/Buonalaterale.jpg` (privata);
  - nel sito va solo una copia ritagliata 4:5, WebP, **senza EXIF**: `public/assets/about/riccardo-640.webp` e `-320.webp` (srcset), fatta da uno script con `sharp` (metadati tolti);
  - alt "Riccardo Cirillo", `width`/`height` nel tag, nessun filtro sulla foto.
- La stessa figurina va anche nel capitolo 0 della Story mode e in Multiplayer, in un componente unico in `scripts/pages.js`.
- **Bottoni:** **CONTACT & CV ▶** (primario, → `/multiplayer/`), STORY MODE, PLAY AGAIN.
- Il testo sta su un pannello pieno (non sullo stadio trasparente): contrasto ≥ 4.5:1 ovunque.
- La figurina entra da sinistra in 300 ms; con reduced motion appare subito.
- Da aggiornare in `CLAUDE.md`: `docs/reference/` resta privata; nel sito c'è solo la copia della foto scelta da Riccardo, senza EXIF.

## 11. Stadio di notte a strati (dietro → davanti)
1. Cielo: 3 bande (`#0b0f1e` → navy) con dithering ordinato 4×4 sui bordi, stelle sparse, una luna.
2. Skyline generico (nessun edificio riconoscibile) con finestre accese.
3. Aloni dei 4 fari, uno strato a parte: si accendono uno dopo l'altro all'avvio. Lampade in griglia giallo e bianco.
4. Tribune con il pubblico (§ 4) e i flash.
5. Tabellone vivo: basi visitate, "HOME RUN".
6. Campo:
   - muro con pannelli pubblicitari generici, pista;
   - prato a scacchi del taglio in 2 toni scuri;
   - pozze di luce sotto i fari con bordo a dithering;
   - terra a gruppi di 2–3 pixel con bordo chiaro dal lato della luce;
   - linee di gesso pulite, basi con ombra.
7. Giocatori con ombre corte in più direzioni (4 fari).
8. Primo piano: tetto del dugout.

Bersaglio di atmosfera: `targets/night_target_640x360.png`. Il pubblico va fatto a gruppi, meno rumoroso. Lo stadio di giorno (`field.png`) non serve più al gioco: la schermata titolo usa questo.

## 12. Accessibilità, movimento, senza JS
- Contrasto ≥ 4.5:1 su HUD, anteprima, lettore e finale. Tastiera completa (Tab, Esc, ← →, Spazio, Indietro del browser). Focus visibile.
- `prefers-reduced-motion` e l'interruttore della pausa:
  - niente scossa, parallasse, fuochi, ola o flash;
  - camera a scatti invece che morbida;
  - pose chiave ferme.
- Niente lampeggi oltre 3 volte al secondo. Niente animazione infinita oltre 5 s senza pausa (il pubblico fermo è ok).
- Senza JS `/play/` mostra lo stadio statico con le basi come link e la barra delle modalità.

## 13. Prestazioni
- Tutte le immagini del gioco < 400 KB. Un solo `requestAnimationFrame` per tutto. Canvas del pubblico a 8 fps. Niente layout thrashing (leggere e scrivere il DOM in fasi separate).
- La foto viene caricata solo quando serve (finale): `loading="lazy"` o caricata all'arrivo a casa base.

## 14. Cosa NON fare
- Niente generatori AI di immagini, niente plugin che generano sprite, niente sprite o personaggi di altri giochi.
- Niente foto nel repo tranne la copia senza EXIF del § 10. `docs/reference/` e `docs/assets-preview/` mai in git.
- Non riscrivere i testi dei casi. Non inventare numeri: tutto da `content/*.md` e `content/facts.md`.
- Non toccare Story mode e Multiplayer, tranne la figurina del § 10.
