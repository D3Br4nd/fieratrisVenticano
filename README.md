# FieraTetris

Un gioco web stile Tetris creato per la Fiera di Venticano, con funzionalità multiplayer, classifica e temi personalizzati.

<!-- Logo non ancora disponibile -->

## Indice

- [Descrizione](#descrizione)
- [Funzionalità](#funzionalità)
- [Requisiti di Sistema](#requisiti-di-sistema)
- [Installazione](#installazione)
- [Esecuzione](#esecuzione)
- [Build per la Produzione](#build-per-la-produzione)
- [Docker](#docker)
- [Sviluppo](#sviluppo)
- [Struttura del Progetto](#struttura-del-progetto)
- [Personalizzazione](#personalizzazione)
- [Problemi Noti](#problemi-noti)
- [Licenza](#licenza)

## Descrizione

FieraTetris è una versione web del classico gioco Tetris, personalizzata per la Fiera di Venticano. Il gioco presenta diverse tematiche visive basate sui settori della fiera (agroalimentare, bioedilizia, mobili, energie rinnovabili e vivaistica) che cambiano con l'avanzare dei livelli.

## Funzionalità

- Gameplay Tetris classico con controlli da tastiera e touch
- Sistema di punteggio con classifica online
- Blocchi speciali con bonus di punteggio
- Temi visivi che cambiano in base al livello
- Effetti sonori e musica di sottofondo
- Interfaccia responsive per desktop e mobile
- Modalità pausa
- Sistema di classifica persistente

## Requisiti di Sistema

- Node.js (v14.0.0 o superiore)
- npm (v6.0.0 o superiore)
- Web browser moderno con supporto HTML5, Canvas e Audio

## Installazione

1. Clona il repository:
   ```bash
   git clone https://github.com/tuo-username/FieraTetris.git
   cd FieraTetris
   ```

2. Installa le dipendenze:
   ```bash
   npm install
   ```

3. Verifica che la cartella `data` esista e sia scrivibile:
   ```bash
   mkdir -p data
   touch data/scores.csv
   chmod 755 data
   chmod 644 data/scores.csv
   ```

## Esecuzione

### Modalità Sviluppo

Per avviare il server in modalità sviluppo:

```bash
npm run dev
```

Il server sarà accessibile all'indirizzo `http://localhost:3000`.

### Modalità Produzione

Per avviare il server in modalità produzione:

```bash
npm start
```

Per impostazione predefinita, il server utilizza la porta 3000. È possibile modificare la porta tramite la variabile d'ambiente `PORT`:

```bash
PORT=8080 npm start
```

## Build per la Produzione

Per creare una build ottimizzata per la produzione:

```bash
npm run build
```

Questo comando:
1. Creerà una cartella `dist` con tutti i file necessari
2. Minificherà i file JavaScript e CSS
3. Ottimizzerà le immagini

Per eseguire la versione di produzione:

```bash
cd dist
node server.js
```

## Docker

È disponibile un Dockerfile per eseguire l'applicazione in un container Docker:

1. Costruisci l'immagine:
   ```bash
   docker build -t fiera-tetris .
   ```

2. Esegui il container:
   ```bash
   docker run -p 3000:3000 fiera-tetris
   ```

Il gioco sarà accessibile all'indirizzo `http://localhost:3000`.

## Sviluppo

### Struttura del Progetto

```
FieraTetris/
├── data/                   # Dati persistenti (punteggi)
├── public/                 # File statici
│   ├── assets/             # Risorse (immagini, audio)
│   │   ├── audio/          # File audio
│   │   │   ├── sfx/        # Effetti sonori
│   │   │   └── ...
│   │   └── img/            # Immagini
│   │       ├── sfondi/     # Sfondi per i diversi livelli
│   │       └── ...
│   ├── css/                # Fogli di stile
│   ├── js/                 # JavaScript client-side
│   │   ├── api.js          # Gestione API
│   │   ├── game.js         # Logica di gioco
│   │   └── ui.js           # Interfaccia utente
│   ├── classifica.html     # Pagina classifica
│   └── index.html          # Pagina principale
├── server.js               # Server Express 
├── package.json            # Configurazione npm
└── README.md               # Questo file
```

### Asset richiesti

Per il funzionamento completo del gioco sono necessari i seguenti asset (ancora da implementare):

#### Audio
- `public/assets/audio/korobeiniki.mp3` - Musica principale
- `public/assets/audio/sfx/move.mp3` - Suono movimento pezzo
- `public/assets/audio/sfx/rotate.mp3` - Suono rotazione pezzo
- `public/assets/audio/sfx/land.mp3` - Suono atterraggio pezzo
- `public/assets/audio/sfx/line.mp3` - Suono cancellazione linea
- `public/assets/audio/sfx/tetris.mp3` - Suono cancellazione 4 linee
- `public/assets/audio/sfx/gameover.mp3` - Suono game over
- `public/assets/audio/sfx/levelup.mp3` - Suono avanzamento livello

#### Immagini
- `public/assets/img/logo-fiera.png` - Logo della fiera
- `public/assets/img/sfondi/enogastronomia.jpg` - Sfondo livello enogastronomia
- `public/assets/img/sfondi/bioedilizia.jpg` - Sfondo livello bioedilizia
- `public/assets/img/sfondi/arredamenti.jpg` - Sfondo livello arredamenti
- `public/assets/img/sfondi/energie_rinnovabili.jpg` - Sfondo livello energie rinnovabili
- `public/assets/img/sfondi/vivaistica.jpg` - Sfondo livello vivaistica
- e altri sfondi secondo i temi definiti in `game.js`

**Nota**: Il gioco attualmente utilizza colori di fallback quando gli asset non sono disponibili.

### Dipendenze

- Express.js - Framework server
- proper-lockfile - Gestione concorrenza scrittura CSV
- Howler.js - Gestione audio (inclusa tramite CDN)

## Personalizzazione

### Dimensioni del gioco

Per modificare le dimensioni della griglia di gioco, cambia le costanti `COLS` e `ROWS` in `game.js`. Assicurati di regolare anche le dimensioni del canvas in `index.html`.

### Pezzi e colori

I tetramini sono definiti in `game.js` nella costante `TETROMINOES`. Puoi modificare forme e colori secondo le tue preferenze.

### Punteggi

Il sistema di punteggio è definito nella costante `SCORE_POINTS` in `game.js`.

## Problemi Noti

- L'audio potrebbe non funzionare su alcuni browser mobili che richiedono un'interazione utente prima di riprodurre suoni
- La classifica richiede un server backend attivo per funzionare

## Licenza

Questo progetto è rilasciato sotto licenza MIT. Vedi il file LICENSE per i dettagli.

---

© 2025 Fiera di Venticano - Tutti i diritti riservati
