# FieraTris Venticano

Un gioco stile Tetris creato appositamente per la Fiera Campionaria di Venticano. Questo progetto combina il classico gameplay di Tetris con elementi tematici legati alla fiera, offrendo un'esperienza di gioco coinvolgente e personalizzata.

![Logo Fiera Venticano](public/assets/img/logo-fiera.png)

## 🎮 Caratteristiche

- **Gameplay classico di Tetris** con meccaniche moderne come l'anteprima del pezzo successivo e l'ombra della posizione di atterraggio
- **Sistema di livelli** con 10 temi diversi ispirati alle aree della Fiera di Venticano
- **Blocchi speciali FCV** che offrono punti bonus quando vengono eliminati
- **Classifica online** per registrare e visualizzare i punteggi migliori
- **Controlli ottimizzati** sia per desktop (tastiera) che per dispositivi touch
- **Effetti visivi** per rendere l'esperienza più coinvolgente

## 🚀 Installazione

### Metodo Standard

```bash
# Clona il repository
git clone https://github.com/tuousername/fieratrisVenticano.git
cd fieratrisVenticano

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

1. Prima di usare Docker Compose, assicurati che il campo `image` nel file docker-compose.yml sia corretto:

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

## 🎯 Come giocare

- **Controlli da tastiera**:
  - ← o A: Muovi a sinistra
  - → o D: Muovi a destra
  - ↓ o S: Muovi giù (soft drop)
  - ↑ o W o Spazio: Ruota
  - Shift: Hard drop (caduta istantanea)
  - P: Pausa

- **Controlli touch**:
  - Pulsanti direzionali a schermo
  - Pulsante di rotazione
  - Pulsanti per pausa e audio

## 🏗️ Struttura del progetto

- `public/`: Contiene tutti i file accessibili dal browser
  - `js/`: File JavaScript del gioco
    - `game.js`: Logica principale del gioco
    - `ui.js`: Gestione dell'interfaccia utente
    - `api.js`: Funzioni per interagire con il server
  - `css/`: Fogli di stile
  - `assets/`: Immagini e audio (nota: gli asset audio e alcuni asset video saranno aggiunti in futuro)
- `data/`: Contiene il database CSV dei punteggi
- `server.js`: Server Node.js per gestire la classifica e servire l'applicazione
- `Dockerfile`: Configurazione per la creazione dell'immagine Docker
- `docker-compose.yml`: Configurazione per l'orchestrazione del container

## 🧩 Temi e livelli

Il gioco presenta 10 livelli, ognuno con un tema ispirato a una categoria espositiva della Fiera di Venticano:

1. **Enogastronomia** - Prodotti tipici e specialità locali
2. **Bioedilizia** - Costruzioni ecosostenibili
3. **Arredamenti** - Mobili e design d'interni
4. **Energie rinnovabili** - Soluzioni energetiche sostenibili
5. **Vivaistica** - Piante e giardinaggio
6. **Agricoltura** - Attrezzature e innovazioni agricole
7. **Tecnologia** - Innovazioni digitali e tecnologiche
8. **Artigianato** - Prodotti artigianali locali
9. **Turismo** - Promozione del territorio
10. **Finale Fiera** - Celebrazione della fiera

La difficoltà aumenta progressivamente con il cambio di livello, rendendo il gioco sempre più sfidante.

## 🧪 Sviluppo

### Prerequisiti
- Node.js 14+ e npm
- Conoscenza base di JavaScript, HTML5 e CSS3

### Aggiungere nuovi asset
Gli asset audio e alcuni asset video non sono ancora presenti nel progetto. Per aggiungerli in futuro:

1. Inserisci i file audio in `public/assets/audio/`
2. Aggiorna la funzione `loadAudio()` in `game.js` per utilizzare i nuovi file
3. Per gli asset video o immagini di sfondo, inseriscili in `public/assets/img/` o `public/assets/video/`

## 📝 Note
- Il gioco utilizza HTML5 Canvas per il rendering
- La persistenza dei punteggi è gestita tramite file CSV
- Il progetto è stato ottimizzato per funzionare anche su dispositivi mobili

## 📜 Licenza

MIT