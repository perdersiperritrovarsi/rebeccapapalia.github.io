## Nome del sito e terza vista

Il titolo del sito resta **Perdersi, ritrovarsi**. Il terzo menu si chiama
**Incontro**, disponibile in `incontro.html`, con trenta tracce delle due serie.
`pxo.html` rimane una copia compatibile per i collegamenti già condivisi.
L'archivio corrente è `gpx/incontro.zip`; la vista a linee è `incontro-linee.html`.
La diffusione iniziale è **Delicata** (0.65) in tutte e tre le viste; Media e Ampia
restano selezionabili. I riferimenti a PxO nelle sezioni precedenti del lavoro
indicano la stessa vista, prima del cambio di nome.

## PxO: le due esperienze sulla stessa carta

`pxo.html` riunisce tutte le trenta traiettorie: quindici Perdersi in indaco e
quindici Ritrovarsi in rosso-arancio, con la stessa inquadratura e lo stesso
istante iniziale 00:00. Gli ID restano P01–P15 in ogni serie e la legenda indica
la serie per distinguere gli omonimi. Non vengono aggiunti o alterati GPX.
L'archivio `gpx/pxo.zip` conserva i file in due cartelle separate.

I depositi dei cammini si mescolano per sovrapposizione in multiply; anche le
gocce mobili della vista PxO si mescolano quando si sovrappongono. Le zone già
attraversate conservano memoria del pigmento, quindi anche passaggi in tempi
diversi possono stratificarsi sulla carta. Non è un modello fisico dei fluidi.
Ogni colore resta modificabile singolarmente. La carta monocromatica, la
rivelazione progressiva e la dissolvenza finale sono condivise dalle tre viste.
La vista a linee corrispondente è `pxo-linee.html`.

## Due esperienze: Perdersi e Ritrovarsi

- `index.html`: **Ritrovarsi**, i quindici percorsi già presenti, colore iniziale #FF2600.
- `perdersi.html`: **Perdersi**, quindici nuove traiettorie P01–P15, colore iniziale indaco #4938A8.
- I collegamenti in alto passano da una serie all'altra; i selettori colore rimangono indipendenti.
- Entrambe condividono la stessa inquadratura, con nord in alto, e la stessa stampa in soli grigi.
- Le versioni a linee sono `percorsi.html` e `perdersi-linee.html`.
- Ogni pagina offre il download del proprio archivio GPX: `gpx/ritrovarsi.zip` o `gpx/perdersi.zip`.

La serie Perdersi è generata sul grafo OpenStreetMap già incluso nel progetto;
non corrisponde a nuove registrazioni raccolte da partecipanti. I metadati GPX
mantengono questa provenienza. I quindici file sono separati in `gpx/perdersi/`,
senza sovrascrivere i file della serie precedente. Partono tutti dal nodo OSM
9704082483 (38.2072486, 15.6585736) e arrivano a quindici punti distinti più a nord.
Soste, velocità e date sono generate e ripetibili. Il report delle geometrie è
`assets/roads/perdersi-report.json`. Si rigenera con:

```sh
python3 tools/build_perdersi.py
python3 tools/build_html.py
```

La stampa, la carta sfocata e la stampa finale vengono convertite pixel per pixel
in scala di grigi: nessuna dominante calda o cromatica nella cartografia. Il nero
delle strade è più marcato. I pigmenti dei cammini restano separati e colorabili.

## Provenienza dei percorsi aggiuntivi

P01–P08 sono le otto registrazioni originali, conservate senza modifiche.
P09–P15 sono traiettorie artistiche generate, non osservazioni di partecipanti.
Le etichette della visualizzazione usano soltanto ID e colori.
La provenienza è mantenuta nei metadati GPX e in questa documentazione.
Tutte le nuove tracce partono dal primo punto di P01 (38.2210700, 15.6667530),
collegato al nodo OpenStreetMap più vicino con un raccordo di circa 7 metri.
Seguono archi connessi della rete OSM pedonale memorizzata in assets/roads.
Almeno il 65% di ogni percorso è a oltre 35 metri dai campioni GPS originali;
i tratti condivisi da due nuovi percorsi non superano il 40% del più corto.
Il campionamento spaziale per questa misura è ogni 15 metri al massimo.
Le soste, le velocità e le date GPX (1 gennaio 2000, convenzionale) sono generate.
Il grafo OSM non garantisce accessibilità o sicurezza effettiva delle strade.
Fonte, query e data in assets/roads/source.json; © OpenStreetMap contributors,
ODbL 1.0: https://www.openstreetmap.org/copyright .
Il report con i nodi, le distanze e le sovrapposizioni è in assets/roads/route-report.json.
Le nuove traiettorie sostituiscono le precedenti ricombinazioni dei GPS originali.

Rigenerazione deterministica, dalla cartella PxO:

```sh
python3 tools/simulate_tracks.py
python3 tools/build_html.py
```

Le simulazioni ampliano la composizione artistica, non il campione della ricerca.

# Perdersi, ritrovarsi

Due proposte grafiche per i quindici cammini (otto registrati e sette simulati) contenuti in `gpx/`: **index.html** (inchiostro) e **percorsi.html** (linee originali).

Aprire **index.html** con un browser: è un singolo file autonomo, con dati, stili e codice incorporati. Non richiede installazioni, connessione o server. Il titolo e i testi sono una proposta modificabile.

La pagina inchiostro si apre all’istante 00:00: la cartografia è inizialmente tenue e sfocata. Camminando, le presenze svelano gradualmente una fascia dai bordi morbidi di strade e nomi. La carta già scoperta resta leggibile; pausa, riavvio, ricerca temporale e visibilità dei percorsi mantengono coerente anche questa rivelazione. “Mostra tutto” svela l’intera mappa e i percorsi completi. **Avvia** fa ripartire tutte le persone dal tempo relativo 00:00. Si possono mettere in pausa, scorrere il tempo, cambiare velocità (1×–120×), tornare alla vista completa e nascondere singoli percorsi cliccando la legenda. La durata a schermo dipende dalla traccia più lunga e dalla velocità di riproduzione.

## Variante inchiostro

La legenda si trova sotto i controlli di riproduzione, a loro volta sotto la mappa. Il campione circolare accanto a ogni presenza apre un selettore colore indipendente: il nuovo pigmento ridisegna goccia e macchie, mantenendo forma, tempo e visibilità del percorso. I colori scelti valgono per la pagina aperta; ricaricando si ripristina la palette iniziale.

Tutte le quindici tracce partono dal colore #FF2600. Il selettore accanto a ciascuna presenza permette di cambiarne il colore in modo indipendente.

Ogni presenza deposita gocce con contorni irregolari, aloni trasparenti, bordi di pigmento e granulosità. La carta ha una trama procedurale. La diffusione cresce nei 100 secondi successivi alla deposizione, secondo il tempo della registrazione: a 30× corrispondono a circa 3,3 secondi sullo schermo. Pausa ferma anche la diffusione; la vista completa mostra le macchie assorbite.

Il controllo **Diffusione sulla carta** regola l’ampiezza delle macchie. Ogni pigmento mantiene il proprio colore; gli strati delle diverse persone si mescolano in modalità multiply. È una simulazione grafica dell’acquerello, senza un modello fisico dei fluidi. Una goccia viene depositata circa ogni 4 secondi registrati; dimensione, orientamento, densità e assorbimento variano. Il passo lento concentra il pigmento, quello veloce lo distribuisce su più spazio. La diffusione usa tre fronti irregolari con lobi, capillari e bordi discontinui; tutti i punti GPS restano incorporati per calcolare le posizioni. La trama, i pigmenti e le variazioni sono generati localmente e ripetibili.

La posizione corrente è rappresentata da una goccia lucida orientata lungo la direzione del movimento. La coda, corta, cresce leggermente con la velocità fino a 8 km/h; la legenda mostra anche il valore numerico e una barra. La velocità è stimata dallo spostamento su una finestra locale di 12 secondi, limitata al segmento GPX corrente, per attenuare il rumore GPS; non è una misura istantanea precisa. Il fattore 30×/60× modifica solo il tempo di riproduzione, non i km/h visualizzati.

## Mappa topografica su carta avorio

La base di `index.html` proviene da OpenTopoMap: strade, nomi dei luoghi, curve di livello e ombreggiatura dei rilievi. Le 12 tessere della sola inquadratura (zoom 15) sono conservate in `assets/topography/` e incorporate nell’HTML come immagini base64. La visualizzazione non interroga servizi esterni.

La cartografia viene desaturata e alleggerita, senza viraggio seppia, poi sovrapposta a un fondo bianco sporco/grigio chiaro (#f2f2f0), con fibre, pori, marezzature, pieghe leggere e bordi appena scuriti. È un’interpretazione a schermo, non una calibrazione del campione fisico. Il trattamento è calcolato una volta sola, sotto i pigmenti. La base è fissa e non navigabile; il suo dettaglio è quello della cartografia sorgente.

Dati © contributori OpenStreetMap, SRTM. Cartografia © OpenTopoMap, CC BY-SA 3.0. Fonte e licenza sono visibili sotto la mappa e in `assets/topography/LICENSE.md`. La versione cromaticamente modificata della mappa è distribuita con la stessa licenza.

`tools/fetch_map.py` prepara le sole tessere del riquadro dai GPX e riusa quelle già salvate. Va eseguito solo quando occorre aggiornare l’area cartografica; richiede accesso a OpenTopoMap e comunica al fornitore gli indici geografici delle tessere. Il normale comando di generazione HTML usa esclusivamente i file locali e non richiede rete.

## Criterio di sincronizzazione

Per ciascun GPX viene sottratto l'orario del primo punto. Le partenze coincidono nel tempo; restano le durate e gli intervalli registrati, comprese le pause rilevate dal GPS. La posizione tra due punti viene interpolata linearmente. Chi termina resta sul punto finale. Eventuali pause non registrate o errori GPS non possono essere ricostruiti.

La geografia rimane quella originale: le partenze non vengono traslate su un unico punto. Nella variante inchiostro, mappa e tracce usano la stessa proiezione Web Mercator, riportata in metri locali alla latitudine media. La versione a linee mantiene la proiezione equirettangolare locale. Il nord è in alto e la barra rappresenta 250 metri. Le distanze sono la somma delle distanze geodetiche tra punti successivi, senza filtraggio degli errori GPS o correzione per l'altitudine. I segmenti GPX separati non vengono congiunti.

Nella versione a linee, le tracce tenui mostrano il percorso complessivo; quelle più marcate mostrano il tratto già percorso. I punti colorati indicano la posizione corrente. Tutti gli 11.783 punti originali sono inclusi.

## Aggiornamento

Dopo aver modificato i GPX o i template `tools/page.html`, `tools/ink.html` o il renderer `tools/ink.js`, dalla directory del progetto eseguire:

```sh
python3 tools/build_html.py
```

Il generatore usa solo la libreria standard di Python e riscrive entrambi gli HTML. Per condividere la variante inchiostro basta copiare `index.html`. Copiare anche `percorsi.html` per mantenere il collegamento al confronto.

## Trattamento calcografico digitale

La rete OpenStreetMap mantiene le coordinate e distingue strade principali,
secondarie e sentieri tramite il campo highway. Il segno nero carbone usa bordi
più marcati sulle strade principali e tratti sottili sui sentieri. Micro-lacune
e fibre deterministiche alleggeriscono localmente l'inchiostro senza sfocare
le linee. I nomi aggiuntivi sono stampati in nero; le tessere topografiche
restano sotto la rete con contrasto e densità ridotti per i rilievi.
È un trattamento digitale della cartografia, non una mappa disegnata a mano.
La matrice viene preparata una sola volta e resta compatibile con la rivelazione
progressiva, il cursore temporale e i colori indipendenti dei percorsi.

## Prova della stampa finale

Versione di riferimento prima della prova: commit `08757a1`.
Alla fine di tutti i cammini (o con “Mostra tutto”), la stampa completa emerge
in circa tre secondi reali, indipendentemente dalla velocità di riproduzione.
Solo i bordi esterni restano sfumati sulla carta; la grana e i pigmenti rimangono.
Riavviando o tornando indietro nel tempo si ripristina la rivelazione locale.
Con la preferenza di movimento ridotto la stampa finale appare senza animazione.

## Zoom ed esplorazione dei luoghi

Nelle tre viste a inchiostro: rotella e pinch ingrandiscono attorno al cursore
(da 1× a 6×); trascinamento e gesti a due dita spostano l'inquadratura.
I pulsanti +, − e Vista intera offrono gli stessi comandi. Da tastiera sulla
mappa: +/−, frecce, 0; Invio apre una presenza, Escape chiude la scheda.
La scala e il nord restano riferimenti fissi; la barra da 250 m si adatta allo zoom.

Una goccia o il pulsante ⌖ nella legenda apre la scheda del luogo. Le coordinate
seguono il tempo corrente della traccia e la scelta della presenza distingue
anche gli ID omonimi in PxO. I punti d'arrivo sono indicati quando si ingrandisce.
Google Maps e Street View si aprono soltanto cliccando i collegamenti esterni:
nessuna fotografia viene inventata, nessuna richiesta a Google avviene durante
la riproduzione e non serve una chiave API. Street View dipende dalla copertura;
le immagini disponibili possono appartenere a un altro momento.
Lo zoom usa la cartografia incorporata: non aggiunge nuove tessere o dettaglio
fotografico alle immagini raster esistenti. La geometria delle strade resta allineata ai percorsi durante zoom e spostamenti.

## Download JPEG della stampa

“Scarica la stampa JPEG” genera la composizione finale completa a 1600×1146 px,
qualità JPEG 95%, con titolo, serie e attribuzioni cartografiche. Usa i pigmenti,
la diffusione e le presenze visibili selezionati al momento del clic. Include
l'intera inquadratura e la dissolvenza ai bordi, senza controlli, schede dei luoghi
o anelli di selezione. Non dipende dal livello di zoom o dal punto della timeline.
La posizione temporale e l'eventuale riproduzione vengono ripristinate dopo
la cattura. Nessun caricamento esterno: il file è creato localmente nel browser.
L'esportazione si abilita quando tutte le tessere incorporate sono pronte.
