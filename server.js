const express = require('express');
const path = require('path');
const fs = require('fs').promises; // Usiamo la versione promise di fs
const lockfile = require('proper-lockfile');
const { parse } = require('csv-parse/sync'); // Per leggere CSV
const cors = require('cors'); // Importa il modulo CORS

const app = express();
const PORT = process.env.PORT || 3000;
const SCORES_FILE_PATH = path.join(__dirname, 'data', 'scores.csv');
const SCORES_LOCK_PATH = path.join(__dirname, 'data', 'scores.csv.lock'); // Path per il file di lock

// Assicura che la directory data e il file punteggi esistano
(async () => {
    try {
        // Crea la directory data se non esiste
        await fs.mkdir(path.dirname(SCORES_FILE_PATH), { recursive: true });
        
        // Verifica se il file esiste, altrimenti crealo
        try {
            await fs.access(SCORES_FILE_PATH);
            console.log(`File punteggi esistente: ${SCORES_FILE_PATH}`);
        } catch {
            console.log(`Creazione nuovo file punteggi: ${SCORES_FILE_PATH}`);
            await fs.writeFile(SCORES_FILE_PATH, 'NomeGiocatore,Punteggio,Timestamp\n');
        }
        
        // Verifica che il file sia scrivibile
        await fs.access(SCORES_FILE_PATH, fs.constants.W_OK);
    } catch (error) {
        console.error('Errore critico file system:', error);
        console.error('Impossibile accedere al file dei punteggi. Verificare permessi directory.');
        process.exit(1); // Termina il server se non possiamo lavorare col file
    }
})();


// Middleware
app.use(cors()); // Abilita CORS per tutte le richieste
app.use(express.json()); // Per parsare JSON body
app.use(express.static(path.join(__dirname, 'public'))); // Serve file statici dalla cartella public

// API Endpoint: Salva Punteggio
app.post('/api/score', async (req, res) => {
    const { name, score } = req.body;

    // Validazione base
    if (!name || typeof name !== 'string' || name.trim().length === 0 || typeof score !== 'number' || score < 0) {
        return res.status(400).json({ 
            success: false,
            message: 'Nome o punteggio non validi.' // In italiano
        });
    }

    const timestamp = new Date().toISOString();
    const csvLine = `${name.trim().replace(/,/g, ';')},${score},${timestamp}\n`; // Sostituisce virgole nel nome

    let release;
    try {
        release = await lockfile.lock(SCORES_FILE_PATH, {
             lockfilePath: SCORES_LOCK_PATH,
             retries: {
                 retries: 5,
                 factor: 3,
                 minTimeout: 100,
                 maxTimeout: 3000,
                 randomize: true,
            },
             stale: 15000 // Tempo in ms dopo cui un lock è considerato vecchio
        });

        await fs.appendFile(SCORES_FILE_PATH, csvLine);

        // Rilascia il lock PRIMA di inviare la risposta
        await release();
        release = null; // Azzera per sicurezza

        res.status(201).json({ 
            success: true,
            message: 'Score saved successfully.' 
        });

    } catch (error) {
        console.error('Error saving score:', error);
        // Assicurati di rilasciare il lock anche in caso di errore se è stato ottenuto
        if (release) {
            try {
                await release();
                // Lock rilasciato dopo errore
            } catch (unlockError) {
                console.error('Error releasing lock after error:', unlockError);
            }
        }
        res.status(500).json({ 
            success: false,
            message: 'Failed to save score.' // In inglese
        });
    }
});


// API Endpoint: Recupera Classifica
app.get('/api/scores', async (req, res) => {
    try {
        // Il file dovrebbe già esistere grazie all'inizializzazione all'avvio
        // Se per qualche motivo non fosse disponibile, gestiamo l'errore

        // Leggi il file
        let data;
        try {
            data = await fs.readFile(SCORES_FILE_PATH, 'utf8');
        } catch (readError) {
            console.error('Error reading scores file:', readError);
            // Se il file non esiste o non è leggibile, restituisci array vuoto
            return res.json([]);
        }
        
        // Parsa i dati CSV usando csv-parse/sync con opzioni robuste
        try {
            const records = parse(data, {
                columns: ['name', 'score', 'timestamp'],
                skip_empty_lines: true,
                skip_records_with_error: true,
                from_line: 2 // Salta l'intestazione
            });
            
            // Processa i record
            const scores = records
                .map(record => ({
                    name: record.name.replace(/"/g, ''),
                    score: parseInt(record.score, 10),
                    date: record.timestamp ? new Date(record.timestamp) : new Date()
                }))
                .filter(record => !isNaN(record.score))
                .sort((a, b) => b.score - a.score)
                .slice(0, 100);
            
            // Scores pronti per l'invio
            res.json(scores);
        } catch (parseError) {
            console.error('Error parsing CSV:', parseError);
            // Se il parsing fallisce, restituisci un errore chiaro
            res.status(500).json({ 
                error: 'Failed to parse CSV data',
                details: parseError.message 
            });
        }
    } catch (error) {
        console.error('Error reading scores:', error);
        res.status(500).json({ 
            error: 'Failed to load scores',
            details: error.message 
        });
    }
});

// Route per servire classifica.html
app.get('/classifica', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'classifica.html'));
});


// Route catch-all per servire index.html (per il gioco principale)
// Deve essere dopo le API e /classifica
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.listen(PORT, () => {
    console.log(`Server FieraTris Venticano avviato su http://localhost:${PORT}`);
});

