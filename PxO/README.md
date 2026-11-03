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
