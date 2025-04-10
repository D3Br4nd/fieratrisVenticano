// Modulo IIFE per Game Logic
const setupGame = (ui, api) => { // Riceve le dipendenze UI e API

    // --- Costanti del Gioco ---
    const COLS = 10;
    const ROWS = 20;
    const BLOCK_SIZE = 30; // Deve corrispondere al canvas / UI

    // Forme dei Tetramini (matrici e colori)
    const TETROMINOES = {
        'I': { shape: [[1, 1, 1, 1]], color: 'cyan' },
        'J': { shape: [[1, 0, 0], [1, 1, 1]], color: 'blue' },
        'L': { shape: [[0, 0, 1], [1, 1, 1]], color: 'orange' },
        'O': { shape: [[1, 1], [1, 1]], color: 'yellow' },
        'S': { shape: [[0, 1, 1], [1, 1, 0]], color: 'lime' }, // Verde chiaro
        'T': { shape: [[0, 1, 0], [1, 1, 1]], color: 'purple' },
        'Z': { shape: [[1, 1, 0], [0, 1, 1]], color: 'red' },
        // Aggiungi qui il pezzo speciale del logo?
        // Potrebbe essere una L rovesciata
        'LOGO': { shape: [[1, 1, 1], [1, 0, 0]], color: '#006400' } // Verde scuro Fiera
    };
    const PIECES = Object.keys(TETROMINOES);

    // Colori per i blocchi FCV (da definire)
    const FCV_COLOR = 'gold'; // Esempio
    const FCV_BONUS = 100; // Punti bonus per blocco FCV in linea

    // Punteggi
    const SCORE_POINTS = { 1: 40, 2: 100, 3: 300, 4: 1200 };

    // Velocità iniziale (ms per step)
    const INITIAL_SPEED = 1000;
    const SPEED_DECREASE = 75; // Quanto diminuisce la velocità per livello
    
    // Soglie di punteggio per aumentare il livello
    const LEVEL_THRESHOLDS = [
        0,     // Livello 1
        500,   // Livello 2
        1500,  // Livello 3
        3000,  // Livello 4
        5000,  // Livello 5
        8000,  // Livello 6
        12000, // Livello 7
        18000, // Livello 8
        25000, // Livello 9
        35000  // Livello 10
    ];
    
    // Temi per ogni livello
    const LEVEL_THEMES = [
        'Enogastronomia',    // Livello 1
        'Bioedilizia',       // Livello 2
        'Arredamenti',       // Livello 3
        'Energie rinnovabili',// Livello 4
        'Vivaistica',        // Livello 5
        'Agricoltura',       // Livello 6
        'Tecnologia',        // Livello 7
        'Artigianato',       // Livello 8
        'Turismo',           // Livello 9
        'Finale Fiera'       // Livello 10
    ];
    
    // Sistema per i wall kicks (rotazione vicino ai muri)
    const WALL_KICKS = {
        'I': [
            [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
            [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
            [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
            [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]]
        ],
        'default': [
            [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
            [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
            [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
            [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]]
        ]
    };

    // --- Stato del Gioco ---
    let grid; // Matrice ROWS x COLS che rappresenta la board
    let currentPiece;
    let nextPiece;
    let pieceX, pieceY; // Posizione del pezzo attuale (angolo top-left)
    let score;
    let level;
    let linesCleared;
    let gameSpeed;
    let isGameOver;
    let isPaused;
    let animationFrameId;
    let lastTime; // Per il game loop basato sul tempo

    let gameAudio = { // Oggetto per gestire l'audio
        music: null,
        move: null,
        rotate: null,
        land: null,
        line: null,
        tetris: null,
        gameover: null,
        level: null,
        isMuted: false
        // TODO: Caricare gli audio (magari con libreria tipo Howler.js o semplici <audio>)
        // TODO: Metodi play/pause/mute
    };


    // --- Funzioni Principali del Gioco ---

    function initializeGrid() {
        return Array.from({ length: ROWS }, () => Array(COLS).fill(null)); // Griglia vuota
    }

    function getRandomPiece() {
        // TODO: Logica per far apparire il pezzo LOGO meno frequentemente?
        const type = PIECES[Math.floor(Math.random() * PIECES.length)];
        const pieceData = TETROMINOES[type];

        // Clona la forma per non modificare l'originale
        const shape = pieceData.shape.map(row => [...row]);

        // TODO: Decidi se e come inserire i blocchi speciali FCV
        // Potrebbe essere casuale su uno dei blocchi '1' della forma
        // Aggiungi una proprietà alla forma o al pezzo per indicare quali blocchi sono FCV
        let hasFCV = false;
        if (Math.random() < 0.15) { // 15% di probabilità di avere un blocco FCV
            // Trova coordinate [y][x] casuali di un blocco '1'
            let attempts = 0;
            while (attempts < 10) {
                 let ry = Math.floor(Math.random() * shape.length);
                 let rx = Math.floor(Math.random() * shape[0].length);
                 if (shape[ry][rx] === 1) {
                     shape[ry][rx] = 2; // Usa '2' per indicare blocco FCV
                     hasFCV = true;
                     break;
                 }
                 attempts++;
            }
        }

        return {
            type: type,
            shape: shape,
            color: pieceData.color,
            hasFCV: hasFCV // Flag per sapere se questo pezzo ha un blocco FCV
            // Aggiungere info FCV ai singoli blocchi se necessario
        };
    }

    function isValidMove(newX, newY, shape) {
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x] > 0) { // Se è parte del pezzo (1 o 2 per FCV)
                    const boardX = newX + x;
                    const boardY = newY + y;

                    // Controlli Collisione:
                    // 1. Fuori dai bordi laterali
                    if (boardX < 0 || boardX >= COLS) return false;
                    // 2. Fuori dal bordo inferiore
                    if (boardY >= ROWS) return false;
                    // 3. Collisione con pezzi già fissati sulla griglia
                    //    (Assicurati che boardY sia >= 0 prima di accedere a grid[boardY])
                    if (boardY >= 0 && grid[boardY][boardX]) return false;
                }
            }
        }
        return true; // Nessuna collisione trovata
    }

    function rotateShape(shape) {
        // Ruota la matrice 90 gradi orario
        const rows = shape.length;
        const cols = shape[0].length;
        const newShape = Array.from({ length: cols }, () => Array(rows).fill(0));
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                if (shape[y][x] > 0) { // Copia solo i blocchi pieni (1 o 2)
                     newShape[x][rows - 1 - y] = shape[y][x];
                }
            }
        }
        return newShape;
    }


    function lockPiece() {
        // Aggiunge il pezzo corrente alla griglia statica
        currentPiece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value > 0) {
                    const boardX = pieceX + x;
                    const boardY = pieceY + y;
                    // Assicurati di essere dentro la griglia (anche se isValidMove dovrebbe averlo già fatto)
                    if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
                        // Salva il colore o un oggetto con colore e info FCV
                         grid[boardY][boardX] = (value === 2) ? FCV_COLOR : currentPiece.color; // Salva colore FCV o normale
                         // Potresti salvare un oggetto: { color: currentPiece.color, isFCV: value === 2 }
                    }
                }
            });
        });
         // TODO: Suono atterraggio (land.mp3)
         playAudio(gameAudio.land);
    }

    function clearLines() {
        let linesClearedCount = 0;
        let bonusFromFCV = 0;
        let linesCleared = []; // Array per tenere traccia delle righe cancellate (per gli effetti)

        for (let y = ROWS - 1; y >= 0; y--) {
            // Controlla se la riga y è piena
            if (grid[y].every(cell => cell !== null)) {
                linesClearedCount++;
                linesCleared.push(y); // Memorizza la riga cancellata

                // Controlla se c'erano blocchi FCV in questa riga
                if (grid[y].some(cell => cell === FCV_COLOR)) { // Assumendo che FCV_COLOR identifichi il blocco
                    bonusFromFCV += FCV_BONUS;
                }

                // Rimuovi la riga y
                grid.splice(y, 1);

                // Aggiungi una nuova riga vuota in cima
                grid.unshift(Array(COLS).fill(null));

                // Poiché abbiamo rimosso una riga, dobbiamo ricontrollare la stessa riga y (che ora contiene la riga precedente)
                y++;
            }
        }

        // Aggiorna punteggio e livello se abbiamo cancellato delle righe
        if (linesClearedCount > 0) {
            const basePoints = SCORE_POINTS[linesClearedCount] || 0;
            score += (basePoints * level) + bonusFromFCV;
            linesCleared += linesClearedCount;
            
            // Controlla se devi aumentare di livello in base al punteggio
            const previousLevel = level;
            for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
                if (score >= LEVEL_THRESHOLDS[i]) {
                    level = i + 1;
                    break;
                }
            }
            
            // Se il livello è cambiato, aggiorna la velocità e riproduci un suono
            if (level !== previousLevel) {
                gameSpeed = Math.max(INITIAL_SPEED - (level - 1) * SPEED_DECREASE, 100); // Minimo 100ms
                console.log(`Livello aumentato a ${level}, nuova velocità: ${gameSpeed}ms`);
                playAudio(gameAudio.level); // Riproduci suono livello aumentato
                
                // Mostra il tema del livello corrente
                const currentTheme = LEVEL_THEMES[level - 1] || LEVEL_THEMES[0];
                ui.updateTheme(currentTheme);
            }
            
            // Riproduci suono appropriato per le linee completate
            if (linesClearedCount === 4) {
                playAudio(gameAudio.tetris); // Tetris! (4 righe)
            } else {
                playAudio(gameAudio.line); // Suono normale per le altre combinazioni
            }
            
            // Crea effetto particelle (se la funzione esiste in UI)
            if (typeof ui.createLineClearParticles === 'function') {
                ui.createLineClearParticles(linesClearedCount);
            }
            
            // Force UI update immediately
            ui.updateScore(score);
            ui.updateLevel(level);
        }
    }

     function spawnNewPiece() {
         currentPiece = nextPiece || getRandomPiece(); // Usa il prossimo o ne genera uno nuovo all'inizio
         nextPiece = getRandomPiece();
         pieceX = Math.floor(COLS / 2) - Math.floor(currentPiece.shape[0].length / 2); // Centro orizzontale
         pieceY = 0; // Parte dall'alto

         ui.renderNextPiece(nextPiece); // Aggiorna la preview

         // Controlla se il gioco è finito (nuovo pezzo collide subito)
         if (!isValidMove(pieceX, pieceY, currentPiece.shape)) {
             isGameOver = true;
             // TODO: Suono game over
             playAudio(gameAudio.gameover);
             if (gameAudio.music) gameAudio.music.pause(); // Ferma musica
             ui.showGameOver(score);
             cancelAnimationFrame(animationFrameId); // Ferma il loop
         }
     }


    // --- Game Loop ---
    function gameLoop(currentTime) {
        if (isGameOver || isPaused) {
            return; // Esce se finito o in pausa
        }

        animationFrameId = requestAnimationFrame(gameLoop); // Richiedi il prossimo frame

        if (!lastTime) {
            lastTime = currentTime;
            return; // Inizializza solo il lastTime al primo frame
        }
        
        const deltaTime = currentTime - lastTime;
        
        // DEBUG - per verificare che il loop stia funzionando
        // console.log('Game loop', deltaTime, gameSpeed);

        // Controlla se è ora di muovere il pezzo verso il basso
        if (deltaTime >= gameSpeed) {
            // Muovi giù
            if (isValidMove(pieceX, pieceY + 1, currentPiece.shape)) {
                pieceY++;
                ui.renderGame({ grid, currentPiece, pieceX, pieceY }); // Renderizza dopo il movimento
            } else {
                // Il pezzo è atterrato
                lockPiece();
                clearLines(); // Controlla e pulisce linee dopo l'atterraggio
                spawnNewPiece(); // Genera il pezzo successivo
                if (isGameOver) return; // Controlla di nuovo se spawn ha causato game over
            }
            
            lastTime = currentTime; // Resetta il timer per la prossima discesa
        }
        
        // Renderizzazione continua (non solo quando cade il pezzo)
        ui.renderGame({ grid, currentPiece, pieceX, pieceY });
    }


    // --- Funzioni di Controllo Esterno ---

    function start() {
        // Resetta tutto
        grid = initializeGrid();
        score = 0;
        level = 1;
        linesCleared = 0;
        gameSpeed = INITIAL_SPEED;
        isGameOver = false;
        isPaused = false;
        lastTime = null;

        spawnNewPiece(); // Genera primo pezzo e prossimo
        spawnNewPiece(); // Chiama di nuovo per avere current e next pronti

        ui.updateScore(score);
        ui.updateLevel(level);
        ui.hideGameOver(); // Assicurati che la schermata sia nascosta
        ui.updatePauseButton(isPaused);
        
        // Imposta il tema del livello iniziale
        const initialTheme = LEVEL_THEMES[0];
        ui.updateTheme(initialTheme);

        // TODO: Avvia musica di sottofondo (in loop)
        if (gameAudio.music && !gameAudio.isMuted) {
             gameAudio.music.loop = true;
             gameAudio.music.play();
         }

        // Cancella eventuale loop precedente e avvia quello nuovo
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        animationFrameId = requestAnimationFrame(gameLoop);
    }

    function handleInput(action) {
        if (isGameOver || isPaused) return;

        let moved = false;
        switch (action) {
            case 'left':
                if (isValidMove(pieceX - 1, pieceY, currentPiece.shape)) {
                    pieceX--;
                    moved = true;
                     playAudio(gameAudio.move);
                }
                break;
            case 'right':
                if (isValidMove(pieceX + 1, pieceY, currentPiece.shape)) {
                    pieceX++;
                    moved = true;
                     playAudio(gameAudio.move);
                }
                break;
            case 'down': // Soft drop
                if (isValidMove(pieceX, pieceY + 1, currentPiece.shape)) {
                    pieceY++;
                    // Resetta timer caduta? Opzionale
                    lastTime = performance.now(); // Fa cadere subito al prossimo step
                    // TODO: Punti per soft drop?
                    moved = true;
                     // playAudio(gameAudio.move); // Forse non serve suono per soft drop
                } else {
                    // Se premendo giù non può muoversi, atterra subito
                    lockPiece();
                    clearLines();
                    spawnNewPiece();
                     if (isGameOver) return;
                }
                break;
            case 'rotate':
                const rotatedShape = rotateShape(currentPiece.shape);
                const kicks = WALL_KICKS[currentPiece.type] || WALL_KICKS.default;
                const rotationIndex = currentPiece.rotationIndex || 0;
                
                for (const [x, y] of kicks[rotationIndex]) {
                    if (isValidMove(pieceX + x, pieceY + y, rotatedShape)) {
                        currentPiece.shape = rotatedShape;
                        pieceX += x;
                        pieceY += y;
                        currentPiece.rotationIndex = (rotationIndex + 1) % 4;
                        moved = true;
                        playAudio(gameAudio.rotate);
                        break;
                    }
                }
                break;
            case 'drop': // Hard drop
                 let testY = pieceY;
                 while (isValidMove(pieceX, testY + 1, currentPiece.shape)) {
                     testY++;
                 }
                 if (testY > pieceY) {
                     // TODO: Punti per hard drop?
                     pieceY = testY;
                     lockPiece();
                     clearLines();
                     spawnNewPiece();
                      if (isGameOver) return;
                 }
                 // moved = true; // Non serve ridisegnare subito, lo fa il loop
                 break;
             case 'pause':
                 togglePause();
                 break;
        }

        // Ridisegna subito dopo un input valido (tranne hard drop che lo fa il loop)
        if (moved && action !== 'drop') {
             ui.renderGame({ grid, currentPiece, pieceX, pieceY });
        }
    }

    function togglePause() {
        if (isGameOver) return;
        isPaused = !isPaused;
        ui.updatePauseButton(isPaused);
        if (isPaused) {
             if (gameAudio.music) gameAudio.music.pause();
             cancelAnimationFrame(animationFrameId); // Ferma loop
         } else {
             if (gameAudio.music && !gameAudio.isMuted) gameAudio.music.play();
             lastTime = null; // Resetta lastTime per evitare scatti dopo pausa
             animationFrameId = requestAnimationFrame(gameLoop); // Riavvia loop
         }
        // TODO: Suono pausa/ripresa?
    }

     function toggleSound() {
     gameAudio.isMuted = !gameAudio.isMuted;
     ui.updateSoundButton(!gameAudio.isMuted);
     // Muta/smuta tutti gli effetti sonori e la musica
     try {
     if (typeof Howler !== 'undefined') {
         Howler.mute(gameAudio.isMuted);
     } else if (gameAudio.music) {
         gameAudio.music.muted = gameAudio.isMuted;
             if (!gameAudio.isMuted && !isPaused && !isGameOver) {
                 gameAudio.music.play();
                }
            }
        } catch (e) {
            console.warn('Error toggling sound:', e);
        }
     }

    function playAudio(sound) {
        if (!sound || gameAudio.isMuted) return;
        
        try {
            // Per Howl oggetti
            if (typeof sound.play === 'function') {
                // Se è un oggetto Howl
                if (sound.state && typeof sound.state === 'function' && sound.state() === 'loaded') {
                    sound.play();
                } else {
                    // Se il suono non è caricato o è un elemento audio normale
                    if (sound.currentTime !== undefined) {
                        sound.currentTime = 0; // Reset se è un elemento audio HTML
                    }
                    sound.play().catch(e => console.warn("Couldn't play sound:", e));
                }
            }
        } catch (e) {
            console.warn("Error playing sound:", e);
        }
    }

     function getCurrentScore() {
         return score;
     }


    // --- Inizializzazione Audio (Esempio base) ---
    // Inizializzazione Audio con Howler.js con handling di asset mancanti
    function loadAudio() {
        try {
            // Controlla se Howler è disponibile
            if (typeof Howl === 'undefined') {
                throw new Error('Howler library not loaded');
            }
            
            // Helper per provare a caricare audio con fallback silenzioso
            const tryLoadAudio = (src, options = {}) => {
                try {
                    const sound = new Howl({
                        src: [src],
                        volume: options.volume || 0.5,
                        loop: options.loop || false,
                        onloaderror: () => {
                            console.warn(`Could not load audio: ${src}`);
                        }
                    });
                    return sound;
                } catch (e) {
                    console.warn(`Error creating Howl for ${src}:`, e);
                    // Ritorna un oggetto silent che implementa l'API minima
                    return { 
                        play: () => {}, 
                        pause: () => {}, 
                        stop: () => {}, 
                        mute: () => {} 
                    };
                }
            };
            
            // Musica di sottofondo
            gameAudio.music = tryLoadAudio('assets/audio/korobeiniki.mp3', { loop: true });
            
            // Effetti sonori
            gameAudio.move = tryLoadAudio('assets/audio/sfx/move.mp3');
            gameAudio.rotate = tryLoadAudio('assets/audio/sfx/rotate.mp3');
            gameAudio.land = tryLoadAudio('assets/audio/sfx/land.mp3');
            gameAudio.line = tryLoadAudio('assets/audio/sfx/line.mp3');
            gameAudio.tetris = tryLoadAudio('assets/audio/sfx/tetris.mp3', { volume: 0.6 });
            gameAudio.gameover = tryLoadAudio('assets/audio/sfx/gameover.mp3', { volume: 0.6 });
            gameAudio.level = tryLoadAudio('assets/audio/sfx/levelup.mp3', { volume: 0.6 });
            
            console.log("Audio system initialized (using Howler.js)");
        } catch (e) {
            console.error("Error setting up audio:", e);
            // Fallback completo a oggetti silent
            gameAudio.music = { play: () => {}, pause: () => {}, stop: () => {} };
            gameAudio.move = { play: () => {} };
            gameAudio.rotate = { play: () => {} };
            gameAudio.land = { play: () => {} };
            gameAudio.line = { play: () => {} };
            gameAudio.tetris = { play: () => {} };
            gameAudio.gameover = { play: () => {} };
            gameAudio.level = { play: () => {} };
        }
    }
    
    // Nota: La funzione playAudio è già definita sopra
    
    // Nota: La funzione toggleSound è già definita sopra

    loadAudio(); // Carica audio all'inizio


    // Esponi le funzioni pubbliche del modulo Game
    return {
        start,
        handleInput,
        getCurrentScore,
        togglePause,
        toggleSound
    };
};

// WALL_KICKS è stato spostato all'inizio del file