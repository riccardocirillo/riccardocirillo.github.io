<!-- [CHECK] translation to review (IT: Riccardo). Translated from content/nipotyno.md on 21/10/2026, updated on 29/10/2026 (F2). -->
---
title: "Nipotyno — Un mentore digitale per gli anziani che usano i servizi pubblici"
slug: nipotyno
base: "Prima base"
description: "Ricerca e design UX di un assistente a doppio schermo che guida le persone anziane a prenotare visite mediche e pagare bollettini pubblici online. SUS 78,75; 6/6 hanno completato entrambi i compiti, uno con l'aiuto del facilitatore."
teaser: "Un assistente a doppio schermo che guida le persone anziane a prenotare visite mediche e pagare bollettini pubblici online."
og_image: /assets/nipotyno/home_05.webp
cover: /assets/nipotyno/home_05.webp
tldr: "In Italia gli anziani devono usare i servizi pubblici online, e molti lo trovano stressante. In un team di 4 abbiamo studiato come se la cavano e testato due concept. Il migliore è diventato un 'mentore digitale' a doppio schermo. Tutti e 6 i partecipanti al test finale hanno completato entrambi i compiti, uno con l'aiuto del facilitatore; SUS 78,75 (Buono)."
stats: "13 interviste · 6 partecipanti · SUS 78,75"
role: "UX researcher e designer (team di 4)"
team: "Riccardo Cirillo, Fabio Vito Papapicco, Andrea Ramaglia Bianchino, Ilaria Salami"
context: "HCI Project, MSc Human-Computer Interaction and Design, Universidad Politécnica de Madrid"
duration: "feb – giu 2026"
tools: "Interviste, osservazione, personas, modello dei compiti, Figma, test think-aloud, SUS, UEQ"
---

## In breve {#tl-dr}
In Italia gli anziani sono spinti a prenotare visite mediche (CUP) e pagare bollettini pubblici (pagoPA) online, e molti dipendono dai figli per farlo. In un team di 4 abbiamo studiato come se la cavano e testato due concept alternativi. Il migliore è diventato un "mentore digitale" a doppio schermo. **6/6 hanno completato entrambi i compiti, uno con l'aiuto del facilitatore · SUS 78,75 (Buono) · tutte e 6 le scale UEQ Buono o Eccellente.**

## Il mio ruolo
- Nella ricerca ho condotto con il team le 13 interviste e le 5 osservazioni, e insieme le abbiamo trasformate in personas e in un modello dei compiti.
- Nella fase a bassa fedeltà ho curato il visual design dei due prototipi in Figma. Ho condotto 2 delle 6 sessioni di test, ho fatto il "computer" (Mago di Oz) in altre 2 e ho analizzato i dati di 2 partecipanti. Ho anche scritto i capitoli di introduzione e metodo.
- Per il prototipo ad alta fedeltà ho costruito il flusso di prenotazione CUP in Figma e ho scritto il protocollo del test (script di benvenuto, procedura, consenso informato). Ho condotto 2 sessioni, ne ho osservate altre 2 e ho fatto l'analisi quantitativa di errori, tempi e azioni.
- Con il team ho scritto il business plan del concept nel corso Entrepreneurship and Business Modelling.

## Il problema
CUP (*Centro Unico di Prenotazione*, il sistema regionale per prenotare visite mediche) e pagoPA (la piattaforma nazionale per pagare le pubbliche amministrazioni) sono obbligatori per molte attività quotidiane. Per chi ha più di 70 anni sono una vera fonte di ansia. I moduli sono fitti e pieni di parole tecniche, e molti hanno paura di fare un errore che non si può annullare, così passano il compito a un familiare.

**Come potremmo aiutare gli anziani a completare questi compiti da soli, senza la paura di "rompere" qualcosa?**

## Ricerca
Abbiamo intervistato 13 persone e ne abbiamo osservate 5 mentre svolgevano compiti reali. Abbiamo trovato tre modelli di comportamento:
- Con una "soluzione ibrida", le persone mescolano carta, telefonate e qualcuno che aiuta per portare a termine un compito digitale.
- Con un "silo mnemonico", memorizzano una sequenza esatta di tocchi, e qualsiasi cambiamento la rompe.
- Nella "ricerca di un porto sicuro", cercano una persona o un luogo familiare che confermi ogni passaggio.

Serviva loro un secondo paio d'occhi che confermi ogni passaggio.

![Mappa di navigazione del prototipo ad alta fedeltà: benvenuto, menu principale, flussi CUP e pagoPA](/assets/nipotyno/navigation-map.webp)

## Idee: due concept a confronto
- A · Digital Gym insegna facendo: una breve lezione, poi prove ed errori in libertà con un riscontro immediato.
- B · Interactive Mentor usa due schermi coordinati. Il telefono mostra il servizio, e un "mentore" su un secondo schermo indica il passo successivo e chiede conferma prima di andare avanti.

Li abbiamo costruiti entrambi come prototipi a bassa fedeltà in Figma e testati con 6 anziani, che pensavano ad alta voce mentre li usavano. Ha vinto il Mentore. Ha portato a meno errori, più efficienza e un SUS di 95,0, ed era il preferito di chi aveva più difficoltà. Gli utenti più sicuri preferivano la Gym.

## Prototipo
Abbiamo trasformato il Mentore in un prototipo ad alta fedeltà a doppio schermo, e i ruoli sono cambiati: il telefono a sinistra è diventato l'assistente, con istruzioni brevi e gentili come "Tocca i riquadri bianchi per compilarli", e lo schermo più grande a destra è diventato il servizio, dove si tocca e si scrive.

Un cambiamento è nato direttamente dai test. Nelle prime sessioni a bassa fedeltà i partecipanti esitavano davanti ai pulsanti di pagamento solo testuali, quindi li abbiamo sostituiti con icone riconoscibili (banca, carta).

### Prova il prototipo

Questo è il prototipo ad alta fedeltà che abbiamo testato. È in italiano, come le sessioni di test. Leggi le istruzioni sullo schermo a sinistra, poi agisci su quello a destra.

<div data-prototype></div>

<details class="proto-data">
<summary>Dati di prova (fittizi)</summary>
<p>Va bene qualsiasi valore in questi formati.</p>
<dl>
<div><dt>CUP · codice della ricetta</dt><dd><code>12345</code> + <code>1234567890</code></dd></div>
<div><dt>CUP · codice fiscale</dt><dd><code>AAAAAA00A00A000A</code></dd></div>
<div><dt>pagoPA · email, in entrambi i campi</dt><dd><code>mario.rossi@email.it</code></dd></div>
<div><dt>pagoPA · carta: numero, scadenza, CVV, nome</dt><dd><code>1111 2222 3333 4444</code> · <code>12/30</code> · <code>123</code> · <code>MARIO ROSSI</code></dd></div>
</dl>
</details>

### Schermate chiave

Due momenti del prototipo, per chi preferisce non aprirlo.

<div class="key-screens">

![Prenotazione CUP: con il modulo compilato, l'assistente a sinistra dice quale pulsante premere](/assets/nipotyno/cup_04.webp)

![Pagamento pagoPA: l'assistente a sinistra mostra dove si trova il codice QR sul bollettino cartaceo](/assets/nipotyno/pa_02.webp)

</div>

## Test
Abbiamo testato il prototipo ad alta fedeltà con 6 persone a casa loro. Ogni sessione è durata dai 40 ai 60 minuti. Uno di noi la conduceva mentre gli altri annotavano tempi, tocchi ed errori. Questa volta i partecipanti non hanno pensato ad alta voce, così i loro tempi si potevano confrontare con i tempi obiettivo che avevamo fissato. Hanno lavorato con documenti cartacei realistici con dati fittizi (una ricetta e un bollettino pagoPA), così nessuno ha dovuto inventarsi nulla.

<div class="phases">
<h3>Una sessione, sette passi</h3>
<ol role="list" aria-label="I sette passi di una sessione di test">
<li><div class="phases-card"><span class="phases-no" aria-hidden="true">1</span><div><h4>Benvenuto</h4><p>"Stiamo testando il design, non te."</p></div></div></li>
<li><div class="phases-card"><span class="phases-no" aria-hidden="true">2</span><div><h4>Consenso</h4><p>Consenso informato letto insieme e firmato.</p></div></div></li>
<li><div class="phases-card"><span class="phases-no" aria-hidden="true">3</span><div><h4>Profilo</h4><p>Età, abitudini digitali, sicurezza con i servizi online.</p></div></div></li>
<li class="is-task"><div class="phases-card"><span class="phases-no" aria-hidden="true">4</span><div><h4>Compito 1&nbsp;· CUP</h4><p>Prenotare una visita specialistica da una ricetta cartacea.</p></div></div></li>
<li class="is-task"><div class="phases-card"><span class="phases-no" aria-hidden="true">5</span><div><h4>Compito 2&nbsp;· pagoPA</h4><p>Pagare un bollettino sanitario da 35&nbsp;€ scansionando il codice QR.</p></div></div><p class="phases-measure"><strong>Misurato per ogni compito:</strong> <span>tempo · tocchi · errori · successo</span></p></li>
<li><div class="phases-card"><span class="phases-no" aria-hidden="true">6</span><div><h4>SUS + UEQ</h4><p>Due questionari standard, uno sull'usabilità e uno sull'esperienza complessiva.</p></div></div></li>
<li><div class="phases-card"><span class="phases-no" aria-hidden="true">7</span><div><h4>Intervista</h4><p>Domande aperte su cosa è stato difficile e cosa ha dato sicurezza.</p></div></div></li>
</ol>
<dl class="phases-facts">
<div><dt>Chi</dt><dd>6 adulti tra i 53 e gli 82 anni, media 67</dd></div>
<div><dt>Dove</dt><dd>A casa</dd></div>
<div><dt>Come</dt><dd>Uno di noi conduceva la sessione, gli altri annotavano tempi, tocchi ed errori; da 40 a 60 min</dd></div>
<div><dt>Setup</dt><dd>Un tablet con i due schermi affiancati</dd></div>
</dl>
</div>

| Metrica | Risultato |
|---|---|
| Compiti completati | **6/6** · 1 con aiuto |
| SUS | **78,75** (Buono; la media è 68) |
| UEQ | Tutte e 6 le scale **Buono o Eccellente** |
| Errori rispetto alla bassa fedeltà | **−10%** prenotazione CUP · **−16%** pagamento pagoPA |

Il SUS è sceso da 95,0 a 78,75 perché qui bisognava inserire dati realistici, come il codice fiscale, e il gruppo comprendeva utenti meno sicuri.

## Risultato
Il concept ha funzionato in condizioni di test realistiche. Una persona ha detto che l'esperienza l'ha fatta sentire indipendente dalla famiglia e dagli uffici pubblici, ed era proprio lo scopo del progetto.

## Cosa cambierei
- Mostrerei il formato prima che arrivi l'errore. I campi del modulo, soprattutto il codice fiscale, hanno causato 8 degli errori dei due partecipanti più anziani.
- Ogni errore dovrebbe essere recuperabile. Un'email sbagliata ha bloccato un partecipante, e il facilitatore è dovuto intervenire.
- I metodi di pagamento devono distinguersi di più: 2 partecipanti su 6 all'inizio hanno scelto quello sbagliato.
- La prossima volta testerei con più persone over 70. Solo 2 dei nostri 6 partecipanti lo erano, e reclutare questa fascia d'età è stato il limite più grande dello studio.
