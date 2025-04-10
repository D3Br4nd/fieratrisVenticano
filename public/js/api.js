const api = (() => { // Modulo IIFE per api

    const API_BASE_URL = ''; // Non serve se chiamiamo dallo stesso dominio/porta

    async function submitScore(name, score) {
        try {
            console.log(`Invio punteggio: ${name} - ${score}`);
            const response = await fetch('/api/score', {
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
            
            console.log('Punteggio inviato con successo:', result);
            return result;
        } catch (error) {
            console.error('API Error:', error);
            throw new Error(error.message || 'Errore di connessione. Riprova più tardi.');
        }
    }

    async function getScores() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/scores`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const scores = await response.json();
            console.log('Scores retrieved successfully');
            return scores;
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