# --- Fase 1: Build ---
# Usa un'immagine Node.js ufficiale (versione Alpine per dimensioni ridotte)
FROM node:18-alpine AS builder

# Imposta la directory di lavoro nell'immagine
WORKDIR /usr/src/app

# Copia i file di definizione delle dipendenze
# Copia prima questi per sfruttare la cache Docker: se non cambiano, non riesegue npm install
COPY package.json package-lock.json* ./

# Installa le dipendenze di produzione
# Usiamo --omit=dev per non installare devDependencies nell'immagine finale
RUN npm install --omit=dev

# Copia il resto del codice dell'applicazione
COPY . .

# Crea la directory per i dati se non esiste (assicura che esista per il volume)
RUN mkdir -p /usr/src/app/data

# --- Fase 2: Run ---
# Usa un'immagine più piccola solo per l'esecuzione, se possibile, o continua con la stessa
# Per semplicità, continuiamo con la stessa immagine base
# FROM node:18-alpine
# WORKDIR /usr/src/app
# Copia solo gli artefatti necessari dalla fase di build
# COPY --from=builder /usr/src/app/node_modules ./node_modules
# COPY --from=builder /usr/src/app/public ./public
# COPY --from=builder /usr/src/app/server.js ./server.js
# COPY --from=builder /usr/src/app/data ./data # Copia la directory vuota

# Esponi la porta su cui l'app Express ascolterà (es. 3000)
EXPOSE 3000

# Definisci il comando per avviare l'applicazione
CMD [ "node", "server.js" ]