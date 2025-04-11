# FieraTris Venticano

Un gioco stile Tetris creato per la fiera campionaria di Venticano.

## Installazione

### Metodo Standard

```bash
# Installa le dipendenze
npm install

# Avvia il server
npm start
```

Il server sarà disponibile all'indirizzo http://localhost:3000

### Utilizzo con Docker

Questo progetto include un Dockerfile e una configurazione Docker Compose per facilitare la distribuzione e l'esecuzione in ambienti containerizzati.

#### Build dell'immagine Docker

```bash
# Build dell'immagine
docker build -t fieratris-venticano .
```

#### Esecuzione diretta con Docker

```bash
# Esecuzione del container esponendo la porta 3000
docker run -p 3000:3000 -v "$(pwd)/data:/usr/src/app/data" --name fieratris fieratris-venticano
```

#### Utilizzo con Docker Compose

Il file `docker-compose.yml` è configurato per gestire il servizio dell'applicazione.

1. Prima di usare Docker Compose, modifica il campo `image` nel file docker-compose.yml:

```yaml
services:
  app:
    image: fieratris-venticano  # Nome dell'immagine che hai creato
```

2. Se necessario, modifica anche il percorso del volume per i dati persistenti:

```yaml
volumes:
  - ./data:/app/data  # Volume per collegare i file CSV
```

3. Avvia il servizio con Docker Compose:

```bash
docker-compose up -d
```

4. Per fermare il servizio:

```bash
docker-compose down
```

## Struttura del progetto

- `public/`: Contiene tutti i file accessibili dal browser
  - `js/`: File JavaScript del gioco
  - `css/`: Fogli di stile
  - `assets/`: Immagini e audio
- `data/`: Contiene il database CSV dei punteggi
- `server.js`: Server Node.js per gestire la classifica
- `Dockerfile`: Configurazione per la creazione dell'immagine Docker
- `docker-compose.yml`: Configurazione per l'orchestrazione del container

## Licenza

MIT
