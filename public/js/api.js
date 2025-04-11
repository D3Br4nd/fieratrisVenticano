const api = (() => { // Modulo IIFE per api
    // Funzione di utilità per gestire errori di rete con timeout
    async function fetchWithTimeout(url, options, timeout = 10000) {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(id);
            return response;
        } catch (error) {
            clearTimeout(id);
            throw error; // Non distingue tra errori di timeout e altri errori
        }
    }

    async function submitScore(name, score) {
        try {
            // Esegue la richiesta al server
            const response = await fetchWithTimeout('/api/score', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    name: name.trim(),
                    score: parseInt(score, 10)
                }),
            });

            const result = await response.json();
            
            // Controlla lo stato HTTP invece del flag success
            if (!response.ok) {
                console.error('Errore invio punteggio:', result.message);
                throw new Error(result.message || 'Errore del server');
            }
            return result;
        } catch (error) {
            console.error('API Error:', error);
            throw new Error(error.message || 'Errore di connessione. Riprova più tardi.');
        }
    }

    async function getScores() {
        try {
            const response = await fetchWithTimeout('/api/scores');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error getting scores:', error);
            // Rilancia l'errore per gestirlo nella pagina della classifica
            throw error;
        }
    }

    // Esponi le funzioni pubbliche
    return {
        submitScore,
        getScores,
    };

})(); // Chiama la IIFE per creare l'oggetto api