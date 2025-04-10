const express = require('express');
const path = require('path');
const fs = require('fs').promises; // Usiamo la versione promise di fs
const lockfile = require('proper-lockfile');
const { parse } = require('csv-parse/sync'); // Per leggere CSV
// Potresti usare csv-writer o semplicemente fs.appendFile per scrivere
// const { createObjectCsvWriter } = require('csv-writer'); // Opzione per scrivere

const app = express();
const PORT = process.env.PORT || 3000;
const SCORES_FILE_PATH = path.join(__dirname, 'data', 'scores.csv');
const SCORES_LOCK_PATH = path.join(__dirname, 'data', 'scores.csv.lock'); // Path per il file di lock

// Assicura che la directory data esista
// Update the initialization block
(async () => {
    try {
        await fs.mkdir(path.dirname(SCORES_FILE_PATH), { recursive: true });
        
        // Force create file with header if doesn't exist
        try {
            await fs.access(SCORES_FILE_PATH);
            console.log('scores.csv exists');
        } catch {
            console.log('Creating scores.csv with header');
            await fs.writeFile(SCORES_FILE_PATH, 'NomeGiocatore,Punteggio,Timestamp\n');
        }
        
        // Verify file is writable
        await fs.access(SCORES_FILE_PATH, fs.constants.W_OK);
        console.log('scores.csv is writable');
    } catch (error) {
        console.error('File system error:', error);
        process.exit(1); // Exit if we can't work with the file
    }
})();


// Middleware
app.use(express.json()); // Per parsare JSON body
app.use(express.static(path.join(__dirname, 'public'))); // Serve file statici dalla cartella public

// API Endpoint: Salva Punteggio
app.post('/api/score', async (req, res) => {
    const { name, score } = req.body;

    // Validazione base
    if (!name || typeof name !== 'string' || name.trim().length === 0 || typeof score !== 'number' || score < 0) {
        return res.status(400).json({ 
            success: false,
            message: 'Nome o punteggio non validi.' 
        });
    }

    const timestamp = new Date().toISOString();
    const csvLine = `${name.trim().replace(/,/g, ';')},${score},${timestamp}\n`; // Sostituisce virgole nel nome

    let release;
    try {
        console.log(`Attempting to lock ${SCORES_LOCK_PATH}`);
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
        console.log('File locked successfully.');

        await fs.appendFile(SCORES_FILE_PATH, csvLine);
        console.log(`Score saved: ${name.trim()}, ${score}`);

        // Rilascia il lock PRIMA di inviare la risposta
        await release();
        console.log('File unlocked.');
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
                console.log('File unlocked after error.');
            } catch (unlockError) {
                console.error('Error releasing lock after error:', unlockError);
            }
        }
        res.status(500).json({ 
            success: false,
            message: 'Failed to save score.'
        });
    }
});


// API Endpoint: Recupera Classifica
app.get('/api/scores', async (req, res) => {
    try {
        let data;
        try {
            data = await fs.readFile(SCORES_FILE_PATH, 'utf8');
        } catch (error) {
            if (error.code === 'ENOENT') {
                // File doesn't exist, create it
                await fs.writeFile(SCORES_FILE_PATH, 'NomeGiocatore,Punteggio,Timestamp\n');
                data = '';
            } else {
                throw error;
            }
        }

        const scores = data.split('\n')
            .filter(line => line.trim() && !line.startsWith('NomeGiocatore')) // Skip header and empty lines
            .map(line => {
                const [name, score, date] = line.split(',');
                return {
                    name: name.replace(/"/g, ''),
                    score: parseInt(score),
                    date: date ? new Date(date) : new Date()
                };
            })
            .sort((a, b) => b.score - a.score) // Ordine decrescente per punteggio
            .slice(0, 100);
        
        console.log(`Inviando ${scores.length} punteggi ordinati.`);
        res.json(scores.length ? scores : []);
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
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Serving static files from: ${path.join(__dirname, 'public')}`);
    console.log(`Scores will be saved to: ${SCORES_FILE_PATH}`);
    console.log(`Lock file path: ${SCORES_LOCK_PATH}`);
});

// Add proper CORS headers if needed (even for same origin)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});