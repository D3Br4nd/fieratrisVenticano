# FieraTris Venticano

Un gioco stile Tetris creato per la fiera campionaria di Venticano.

## Installazione

```bash
# Installa le dipendenze
npm install

# Avvia il server
npm start
```

Il server sarà disponibile all'indirizzo http://localhost:3000

## Struttura del progetto

- `public/`: Contiene tutti i file accessibili dal browser
  - `js/`: File JavaScript del gioco
  - `css/`: Fogli di stile
  - `assets/`: Immagini e audio
- `data/`: Contiene il database CSV dei punteggi
- `server.js`: Server Node.js per gestire la classifica

## Pulizia repository

Per rimuovere i file `.DS_Store` dal repository:

```bash
# Rendi eseguibile lo script
chmod +x remove_ds_store.sh

# Esegui lo script
./remove_ds_store.sh

# Esegui un commit per finalizzare la rimozione
git commit -m "Rimossi file .DS_Store dal repository"
```

## Licenza

MIT
