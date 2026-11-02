# Portfolio v4 · "Art pass + gioco continuo" — esecuzione autonoma

Aggiornato: 02/11/2026. Specifiche: `docs/ART_BIBLE.md`. Bersagli e tavole: `docs/assets-preview/art-bible/` (privata).
Ramo `v4`. Il sito online NON cambia: la pubblicazione (merge in `main`) la decide Riccardo alla fine, con il comando in fondo.

## Come si lancia (Riccardo)
1. Seconda scheda del Terminale: `caffeinate -dims`. Mac in carica, coperchio aperto.
2. Prima scheda: `cd ~/Desktop/PORTFOLIO && claude` (auto mode è già il default). `/model` → Opus.
3. Incolla: `Leggi docs/PROMPT_V4.md ed esegui la sezione ESECUZIONE AUTONOMA dall'inizio alla fine.`
4. Se la sessione si interrompe (rete, Mac spento): `claude --continue` e poi `Continua da docs/PROGRESS_V4.md.`

---

## ESECUZIONE AUTONOMA (per Claude Code)

### Autorizzazione per questo lavoro
Riccardo ha autorizzato un'esecuzione **completamente autonoma** delle fasi 0 → F. Per tutto il lavoro descritto qui vale questo, anche dove `CLAUDE.md` dice di proporre un piano e aspettare:
- **non usare plan mode e non aspettare approvazioni**, non fare domande, non fermarti a metà;
- quando devi scegliere, scegli la soluzione più semplice coerente con `docs/ART_BIBLE.md` e scrivila in `docs/DECISIONS.md` con "(auto)";
- a fine lavoro, una relazione finale (sezione "Fine").

Restano invariate TUTTE le altre regole di `CLAUDE.md`: privacy, arte originale, sito senza JS, niente foto in git tranne la copia del § 10 di ART_BIBLE, mai push su `main`, mai merge.

### Regole di lavoro (valgono per ogni fase)
1. **Stato:** tieni `docs/PROGRESS_V4.md` aggiornato: fase attuale, cosa è fatto, cosa manca, problemi aperti. Aggiornalo a fine di ogni fase e prima di ogni operazione lunga. Se il contesto viene compattato, rileggi prima `docs/PROGRESS_V4.md` e `docs/ART_BIBLE.md`.
2. **Commit:** uno (o più) per fase, messaggio `v4 <fase>: …`, solo con build e test verdi. Mai committare una build rotta. Dopo il commit prova `git push -u origin v4`; se la rete non va, scrivilo in PROGRESS e vai avanti (riprova alla fine).
3. **Test:** prima di `npm test` chiudi qualsiasi processo sulla porta 4173 (`lsof -ti:4173 | xargs kill 2>/dev/null`), altrimenti Playwright riusa un vecchio server e testa la build vecchia. Il server di `npm run dev` per gli screenshot va lanciato in background e chiuso a fine fase.
4. **Errori:** se un test o la build falliscono, correggi la causa. Dopo 3 tentativi senza successo su la stessa cosa: torna all'ultimo stato verde di quella parte (git), scrivi il problema in PROGRESS sotto "Problemi aperti" con l'errore esatto e passa alla parte successiva. Non disattivare né indebolire i test per farli passare: se un test vecchio controlla qualcosa che ART_BIBLE ha cambiato apposta (es. dimensioni di runner.png, coordinate delle basi), aggiornalo e scrivilo in DECISIONS.
5. **Non toccare:** testi dei casi (tranne il nuovo campo `teaser:`), `content/facts.md`, PDF dei CV, Story mode e Multiplayer (tranne la figurina del § 10), `docs/reference/` (solo lettura).
6. **Non usare:** generatori AI di immagini, plugin che generano sprite, sprite di altri giochi, `scripts/draw.mjs` o `scripts/assets.mjs` della taste-skill.
7. **Cancellazioni:** i file sostituiti (vecchi generatori, vecchi PNG) vanno in `scripts/_archive/` o `public/_archive/` (esclusi dalla build), non cancellati, così si torna indietro facilmente.
8. **Prove visive:** guarda sempre le pagine con il Playwright MCP o con screenshot di Playwright. Salva gli screenshot di controllo in `docs/assets-preview/art-bible/runs/<fase>/` (privata).

### Controllo qualità al posto delle approvazioni
Al posto dei checkpoint di Riccardo ci sono 2 **porte di qualità automatiche** (fine fase B e fine fase F). Si passa solo se tutto è ✔:
1. **Controlli automatici verdi** (`tests/art.spec.js` + tutti gli altri test).
2. **Revisione indipendente:** lancia un subagent che non ha visto il lavoro. Gli dai solo `docs/ART_BIBLE.md`, i bersagli in `targets/` e i nuovi screenshot o fogli. Deve rispondere con un elenco di difetti, ognuno con gravità alta/media/bassa, usando questa griglia:
   - si legge la silhouette?
   - sopra o sotto il bersaglio?
   - pixel isolati o scalini irregolari?
   - la luce viene sempre da in alto a sinistra?
   - le pose si capiscono a 1×?
   - si nota del tremolio?
   - il contrasto è sufficiente?
   - il testo è leggibile?
3. **Correggi** tutti i difetti alti e medi, poi rilancia la revisione (massimo 3 giri). Quello che resta lo scrivi in PROGRESS come "[CHECK] da guardare" e vai avanti.
4. Salva il foglio finale della porta in `docs/assets-preview/art-bible/gate-B.png` / `gate-F.png`.

---

### FASE 0 · Controlli iniziali
- `git branch --show-current` deve dare `v4` (altrimenti `git checkout v4` o `git checkout -b v4` da `main`). Working tree: ci sono solo `docs/ART_BIBLE.md`, `docs/PROMPT_V4.md` e `.claude/` non tracciati; committa i due docs (`v4 0: art bible e prompt`). `.claude/` non va mai committata.
- `node -v` ≥ 20; `npm install`; `npx playwright install chromium` se mancano i browser; verifica che `sharp` funzioni.
- Base di partenza: `npm run build` e `npm test` sul codice attuale. Scrivi in PROGRESS quanti test passano. Se qualcosa era già rosso, annotalo: non è colpa della v4, ma correggilo se è semplice.
- Leggi CLAUDE.md, ART_BIBLE (tutto), SPEC, DECISIONS, `docs/assets-preview/art-bible/README.md`, guarda tutte le immagini di `boards/` e `targets/`. Poi leggi `src/game.js`, `src/tour.js`, `src/field-map.js`, `scripts/art/*.js`, `scripts/pages.js` (le parti di /play/), i test che toccano il gioco.
- Scrivi in PROGRESS il tuo piano a punti per le fasi A–F (per te, non serve approvazione) e parti.

### FASE A · Strumenti
- CLAUDE.md: aggiungi `docs/ART_BIBLE.md` in "Read first". La regola delle foto diventa: "docs/reference/ resta privata; nel sito c'è solo la copia senza EXIF della foto scelta da Riccardo (public/assets/about/)". In "Working with Riccardo" aggiungi: "Per lavori autorizzati come autonomi (es. docs/PROMPT_V4.md) non serve aspettare l'approvazione del piano".
- **Formato delle griglie** `art/sprites/<nome>.txt` (ART_BIBLE § 1). Per non dover riscrivere 48 righe a ogni frame, aggiungi questa sintassi:
  - `--- <tag> <n> <ms>`: frame completo (48 righe);
  - `--- <tag> <n> <ms> from=<tag> <n>`: copia di un altro frame, seguita solo dalle righe che cambiano, nella forma `NN: <48 caratteri>`;
  - `@part <nome> x,y`: incolla una griglia-parte (es. testa, accessorio) in quel punto.
- **`scripts/art/grid.js`** (sharp): legge le griglie e scrive `public/game/<sheet>.png` + `<sheet>.json` (frame, durata, tag). Deve **fermarsi con un errore chiaro** (file:riga) su righe di lunghezza sbagliata, caratteri fuori legenda, frame mancanti o durate mancanti. `npm run art` rigenera tutto.
- **`/art-lab/`** solo in dev (non in `PAGES`, non in `dist`):
  - zoom 8× con griglia, play a velocità vera, onion skin;
  - prima/dopo (lo sprite vecchio da `public/_archive/`);
  - prova silhouette e prova in grigi;
  - i 3 tagli della camera.

  Aggiungi un test che verifica che `/art-lab/` NON esiste nella build.
- **Controlli** in `tests/art.spec.js`:
  - solo colori della palette;
  - pixel isolati (con un'eccezione nella legenda per occhi e riflessi);
  - contorni mai `#000`;
  - durata su ogni frame;
  - soglia di tremolio per tag;
  - peso dei PNG (§ 13).
- **Prova del metodo:** converti `docs/assets-preview/art-bible/targets/batter_idle0.txt` nel nuovo formato, rigeneralo, confronta il PNG con `batter_idle0_48.png` (devono essere identici pixel per pixel) e mostralo in `/art-lab/`.

### FASE B · Riccardo, pose chiave (→ porta di qualità B)
- ART_BIBLE § 2 e § 3. Pose chiave per tutte e 3 le divise, con accessorio:
  - attesa al piatto (frame 0);
  - swing al contatto;
  - corsa (contatto);
  - 5 in alto (contatto);
  - salto a casa;
  - camminata.
- Metodo: per ogni posa almeno 3 giri di disegno → `npm run art` → screenshot di `/art-lab/` a 8× e 1× → correzione. Devono superare `targets/batter_idle0_48.png`: mento, mani, torsione del busto, mazza leggibile, guanti e polsini.
- **Porta di qualità B** (sezione sopra). Foglio `gate-B.png`: pose a 8× + silhouette + grigi + lo sprite vecchio accanto.

### FASE C · Animazioni complete, crew, pubblico
- Tutti i frame della tabella ART_BIBLE § 5 con le durate nel JSON, fatti partire dalle pose chiave (`from=`).
- Personaggi del § 4:
  - coach 1ª e 3ª;
  - lanciatore;
  - 3 compagni;
  - 8 tifosi 6×10.
- Sostituisci `runner.png`/`crew.png` e i loro JSON. Aggiorna CSS, anteprima OG e test che li usano. Vecchi file in `_archive/`.

### FASE D · Stadio e schermo intero
- Stadio di notte a strati (§ 11), mondo 640×360 + 32 px di margine. Bersaglio di atmosfera `targets/night_target_640x360.png`, con il pubblico a gruppi e meno rumore.
- Nuova `src/field-map.js` (basi, coach, compagni, dugout, fari). Aggiorna i test di `field.spec.js` e `stadium.spec.js` alle nuove coordinate.
- `/play/` con JS a 100dvw × 100dvh, senza cornice né scroll. Scala intera che copre lo schermo, camera con `translate` intero e lerp, tagli per desktop, tablet, telefono verticale e orizzontale (§ 7). Le basi restano `<a>` dentro il mondo.
- La schermata titolo e la 404 usano il nuovo stadio, scurito dove c'è testo (contrasto ≥ 4.5:1).

### FASE E · Percorso
- ART_BIBLE § 6, § 8, § 9, § 10.
- HUD in una riga con ✕ Exit sempre visibile.
- Anteprima non modale: a destra su desktop, in basso su telefono, con READ ▶ e NEXT BASE →.
- Lettore nel gioco: un `<dialog>` con tema paper, che carica il `<main>` della pagina vera con `fetch`, usa `pushState`; Indietro e Esc lo chiudono. Se `fetch` fallisce, vai alla pagina vera.
- Momenti:
  - 5 in alto in 1ª e 3ª;
  - esultanza in 2ª;
  - festa a casa base;
  - poi il finale About me.
- **Foto:** `scripts/photo.js` (sharp) da `docs/reference/Buonalaterale.jpg` → `public/assets/about/riccardo-640.webp` e `-320.webp`.
  - Ritaglio 4:5, testa e spalle come in `boards/Bust.png`.
  - Togli tutti i metadati, poi verifica con sharp che non ci sia EXIF e mettilo in un test.
  - La foto originale non va mai copiata in `public/`.
- **Figurina:** un componente unico in `scripts/pages.js`, usato nel finale, nel capitolo 0 della Story mode e in Multiplayer.
- **`teaser:`** in `content/nipotyno.md`, `levante.md`, `sensor-lab.md` (+ es/, it/): una riga presa dalla `description`, nessun fatto nuovo; ES/IT con `[CHECK]`. Sensor lab è ancora un segnaposto: il teaser dice che il caso è in preparazione.
- `/play/#<caso>` riapre sulla base. Lo stato va in `sessionStorage` dentro try/catch. Senza JS tutto resta navigabile.
- Stringhe nuove in `src/i18n.js` (EN definitivo, ES/IT `[CHECK]`).

### FASE F · Momenti, rifinitura, prove (→ porta di qualità F)
- **Home run:** scia, fuochi, ola, flash, tabellone HOME RUN (max 3 s), pausa d'impatto, scossa di 2 px. Fari che si accendono all'avvio.
- **Reduced motion:** tutto spento (§ 12). Rispetta il budget del § 13.
- **Test Playwright nuovi:**
  - schermo intero senza scroll a 1280×800, 1440×900, 1024×768, 390×844, 844×390;
  - ✕ Exit visibile e focalizzabile;
  - giro completo: swing → anteprima 1ª → READ → lettore → Esc → ancora sulla 1ª → NEXT → 2ª → 3ª → casa → finale con foto e link Contact & CV;
  - Indietro del browser chiude il lettore;
  - `/play/#levante` apre sulla 2ª;
  - axe su ogni schermata;
  - reduced motion;
  - senza JS;
  - la foto senza EXIF;
  - `/art-lab/` assente dalla build.
- **Definizione di fatto** di `docs/ROADMAP.md`:
  - build;
  - `npm test` tutto verde;
  - screenshot 1280 e 390 di ogni passo del percorso in `runs/F/`;
  - tastiera, contrasto, reduced motion;
  - nessun errore in console.
- **Porta di qualità F:** il revisore guarda gli screenshot del percorso e prova il giro con Playwright. Foglio `gate-F.png`.
- Aggiorna SPEC.md: nuova sezione "v4" in cima.

### Fine
- `docs/PROGRESS_V4.md` con la **relazione finale**:
  - cosa è stato fatto per fase;
  - risultati dei test (numeri);
  - decisioni "(auto)" importanti;
  - "[CHECK] da guardare";
  - problemi aperti.
- Ultimo push del ramo `v4` (riprova se prima non andava). Non fare merge.
- Messaggio finale a Riccardo in italiano semplice, al massimo 10 righe:
  - cosa guardare;
  - come provarlo (`npm run dev` → http://localhost:5173/play/);
  - il comando di pubblicazione qui sotto.

---

## Pubblicazione (solo quando lo decide Riccardo, dopo aver giocato in locale)
```
Controlla che tutti i test passino su v4. Poi unisci v4 in main e fai push. Aspetta il deploy di GitHub Actions e mostrami il sito online (titolo, /play/ a 1280 e 390 px). Scrivi la riga in DECISIONS.md.
```
