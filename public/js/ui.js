// Modulo IIFE per UI
const setupUI = (elements) => {
    const { canvas, nextPieceCanvas, scoreElement, levelElement, themeElement, gameOverScreen, finalScoreElement, playerNameInput, submitScoreButton, playAgainButton, pauseButton, soundButton, logoImg } = elements;
    const ctx = canvas.getContext('2d');
    const nextCtx = nextPieceCanvas.getContext('2d');

    const BLOCK_SIZE = canvas.width / 10; // Assumendo 10 colonne
    const NEXT_BLOCK_SIZE = nextPieceCanvas.width / 4; // Assumendo preview 4x4
    
    // Colori per le particelle
    const PARTICLE_COLORS = ['#FF5252', '#FFEB3B', '#4CAF50', '#2196F3', '#9C27B0'];
    const PARTICLE_LIFETIME = 1000; // ms

    let handleInputCallback = null; // Funzione da chiamare per l'input
    let playAgainCallback = null;
    let submitCallback = null;
    let pauseToggleCallback = null;
    let soundToggleCallback = null;
    let particles = [];
    let lastParticleTime = 0;

    let isSoundOn = true; // Stato iniziale audio
    let isPaused = false; // Stato iniziale pausa
    
    // Flag per tracciare lo stato del popup
    let isGameOverVisible = false;
    
    // Inizializza gli eventi di input per il campo nome
    if (playerNameInput) {
        // Previene la propagazione degli eventi tastiera dall'input
        ['keydown', 'keyup', 'keypress'].forEach(eventType => {
            playerNameInput.addEventListener(eventType, e => e.stopPropagation(), true);
        });
    }
    
    // Funzione per controllare se l'input è attivo
    function isInputActive() {
        return isGameOverVisible && document.activeElement === playerNameInput;
    }
    
    // Rendi la funzione accessibile globalmente
    window.isInputActive = isInputActive;


    // --- Funzioni di Disegno ---

    function clearCanvas(context, canvasElement) {
        context.clearRect(0, 0, canvasElement.width, canvasElement.height);
    }

    function drawBlock(context, x, y, color, blockSize) {
        context.fillStyle = color;
        context.fillRect(x * blockSize, y * blockSize, blockSize, blockSize);
        context.strokeStyle = '#333'; // Contorno blocchi
        context.lineWidth = 1;
        context.strokeRect(x * blockSize, y * blockSize, blockSize, blockSize);
    }

    function drawPiece(context, piece, offsetX, offsetY, blockSize, isShadow = false) {
        piece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value > 0) {
                    if (isShadow) {
                        // Per l'ombra, usa una versione semitrasparente del colore originale
                        context.fillStyle = 'rgba(0,0,0,0.2)';
                        context.fillRect((offsetX + x) * blockSize, (offsetY + y) * blockSize, blockSize, blockSize);
                        context.strokeStyle = 'rgba(0,0,0,0.1)';
                        context.lineWidth = 1;
                        context.strokeRect((offsetX + x) * blockSize, (offsetY + y) * blockSize, blockSize, blockSize);
                    } else {
                        // Per il pezzo normale, usa la funzione drawBlock esistente
                        let color = value === 2 ? 'gold' : piece.color; // Gestisce blocchi speciali FCV
                        drawBlock(context, offsetX + x, offsetY + y, color, blockSize);
                    }
                }
            });
        });
    }
    
    // Funzioni per le particelle
    function updateParticles(currentTime) {
        particles = particles.filter(p => {
            const progress = (currentTime - p.startTime) / p.lifetime;
            return progress < 1;
        });
    }
    
    function drawParticles(context) {
        const now = performance.now();
        updateParticles(now);
        
        particles.forEach(p => {
            const progress = (now - p.startTime) / p.lifetime;
            const alpha = 1 - progress;
            const size = p.size * (1 - progress * 0.5);
            
            context.save();
            context.globalAlpha = alpha;
            context.fillStyle = p.color;
            context.fillRect(
                p.x - size/2, 
                p.y - size/2, 
                size, 
                size
            );
            context.restore();
        });
    }
    
    function renderGame(gameState) {
        clearCanvas(ctx, canvas);
        drawGrid(ctx, gameState.grid, BLOCK_SIZE);
        
        // Disegna l'ombra prima se disponibile
        if (gameState.currentPiece && gameState.shadowY !== undefined && gameState.shadowY > gameState.pieceY) {
            drawPiece(ctx, gameState.currentPiece, gameState.pieceX, gameState.shadowY, BLOCK_SIZE, true);
        }
        
        // Disegna il pezzo corrente
        if (gameState.currentPiece) {
            drawPiece(ctx, gameState.currentPiece, gameState.pieceX, gameState.pieceY, BLOCK_SIZE);
        }
        
        drawParticles(ctx);
    }
    
    function createLineClearParticles(lines) {
        const now = performance.now();
        if (now - lastParticleTime < 100) return; // Limit particle creation rate
        
        lastParticleTime = now;
        
        for (let i = 0; i < lines * 20; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: 5 + Math.random() * 10,
                color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
                startTime: now,
                lifetime: PARTICLE_LIFETIME * (0.7 + Math.random() * 0.6)
            });
        }
    }
    
    function drawGrid(context, grid, blockSize) {
        grid.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) { // Se la cella ha un colore (non è vuota)
                    drawBlock(context, x, y, value, blockSize);
                }
            });
        });
    }

    function renderNextPiece(nextPiece) {
        clearCanvas(nextCtx, nextPieceCanvas);
        if (nextPiece) {
             // Centra il pezzo nella preview (calcolo approssimativo)
             const shape = nextPiece.shape;
             const pieceWidth = shape[0].length;
             const pieceHeight = shape.length;
             const offsetX = Math.floor((4 - pieceWidth) / 2);
             const offsetY = Math.floor((4 - pieceHeight) / 2);
             drawPiece(nextCtx, nextPiece, offsetX, offsetY, NEXT_BLOCK_SIZE);
        }
    }

    function updateScore(score) {
        scoreElement.textContent = score;
    }
    
    function updateTheme(theme) {
        if (themeElement) {
            themeElement.textContent = theme;
        }
    }

    function updateLevel(level) {
        levelElement.textContent = level;
        
        // Temi per i livelli con colori associati
        const themes = [
            { name: 'enogastronomia', color: '#8BC34A' },      // Verde chiaro
            { name: 'bioedilizia', color: '#795548' },         // Marrone
            { name: 'arredamenti', color: '#FF9800' },         // Arancione
            { name: 'energie_rinnovabili', color: '#03A9F4' }, // Azzurro
            { name: 'vivaistica', color: '#4CAF50' },          // Verde
            { name: 'agricoltura', color: '#689F38' },         // Verde oliva
            { name: 'tecnologia', color: '#2196F3' },          // Blu
            { name: 'artigianato', color: '#E65100' },         // Arancione scuro
            { name: 'turismo', color: '#9C27B0' },            // Viola
            { name: 'finale_fiera', color: '#FFC107' }         // Giallo dorato
        ];
        
        // Limita il livello all'array di temi disponibili
        const themeIndex = Math.min(level - 1, themes.length - 1);
        const theme = themes[themeIndex];
        
        // Aggiorna il colore di sfondo
        canvas.style.backgroundImage = 'none';
        canvas.style.backgroundColor = theme.color;
        
        // Aggiorna il testo del tema
        if (themeElement) {
            themeElement.textContent = theme.name.replace('_', ' ')
                .split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        }
    }

    // --- Gestione UI Interattiva ---

    function showGameOver(score) {
        finalScoreElement.textContent = score;
        gameOverScreen.style.display = 'flex';
        isGameOverVisible = true;
        
        // Focus sull'input con piccolo delay
        setTimeout(() => {
            playerNameInput.value = '';
            playerNameInput.focus();
        }, 100);
    }

    function hideGameOver() {
        gameOverScreen.style.display = 'none';
        isGameOverVisible = false;
        playerNameInput.value = '';
    }

    function setupInputListeners(callback) {
        handleInputCallback = callback; // Salva la funzione di gestione input del gioco

        // Listener Tastiera
        document.addEventListener('keydown', (e) => {
            // Controlla se siamo nel campo di input nome
            if (isInputActive()) {
                return; // Input del nome attivo, non processare i tasti di gioco
            }
            
            // Ignora input quando il gioco è in pausa o non c'è un callback valido
            if (!handleInputCallback || isPaused) return;
            
            // Controlla se un elemento input o textarea ha il focus (piano di sicurezza)
            const activeElement = document.activeElement;
            const isInputFocused = activeElement && (activeElement.tagName === 'INPUT' || 
                                                   activeElement.tagName === 'TEXTAREA' ||
                                                   activeElement.contentEditable === 'true');
            if (isInputFocused) return;

            // Converti a minuscolo per gestire sia minuscole che maiuscole
            const key = e.key.toLowerCase();
            
            switch (key) {
                case 'arrowleft':
                case 'a':
                    handleInputCallback('left');
                    e.preventDefault();
                    break;
                case 'arrowright':
                case 'd':
                    handleInputCallback('right');
                    e.preventDefault();
                    break;
                case 'arrowdown':
                case 's':
                    handleInputCallback('down');
                    e.preventDefault();
                    break;
                case 'arrowup':
                case 'w':
                case ' ': // Spazio per ruotare
                    handleInputCallback('rotate');
                    e.preventDefault();
                    break;
                case 'shift': // Hard drop con Shift
                    handleInputCallback('drop');
                    e.preventDefault();
                    break;
                case 'p': // Pausa
                    handleInputCallback('pause');
                    e.preventDefault();
                    break;
            }
        });

        // Listener Bottoni Touch standard
        document.getElementById('btn-left')?.addEventListener('click', () => handleInputCallback && !isPaused && handleInputCallback('left'));
        document.getElementById('btn-right')?.addEventListener('click', () => handleInputCallback && !isPaused && handleInputCallback('right'));
        document.getElementById('btn-down')?.addEventListener('click', () => handleInputCallback && !isPaused && handleInputCallback('down'));
        document.getElementById('btn-rotate')?.addEventListener('click', () => handleInputCallback && !isPaused && handleInputCallback('rotate'));
        
        // Listener Bottoni UI
        playAgainButton.addEventListener('click', () => {
            hideGameOver();
            if (playAgainCallback) playAgainCallback();
        });

        submitScoreButton.addEventListener('click', async () => {
            const name = playerNameInput.value.trim();
            if (name && submitCallback) {
                submitScoreButton.disabled = true;
                submitScoreButton.textContent = "Invio...";
                
                try {
                    await submitCallback(name);
                    // Dopo il callback, verifichiamo se vogliamo reindirizzare subito
                    // verso la pagina della classifica senza attendere hideGameOver()
                    window.location.href = 'classifica.html';
                } catch (error) {
                    console.error("Submission error:", error);
                    alert(error.message || "Errore nell'invio del punteggio. Riprova.");
                    submitScoreButton.disabled = false;
                    submitScoreButton.textContent = "Invia Punteggio";
                }
            } else if (!name) {
                alert("Per favore, inserisci un nome valido.");
                playerNameInput.focus();
            }
        });

        pauseButton.addEventListener('click', () => {
            if (pauseToggleCallback) pauseToggleCallback();
        });

        soundButton.addEventListener('click', () => {
            if (soundToggleCallback) soundToggleCallback();
        });
    }

    function setPlayAgainCallback(callback) {
        playAgainCallback = callback;
    }
    
    function setSubmitCallback(callback) {
        submitCallback = callback;
    }
    
    function setPauseToggleCallback(callback) {
        pauseToggleCallback = callback;
    }
    
    function setSoundToggleCallback(callback) {
        soundToggleCallback = callback;
    }

    function updatePauseButton(paused) {
        isPaused = paused;
        pauseButton.textContent = paused ? 'Riprendi' : 'Pausa';
    }

    function updateSoundButton(soundOn) {
        isSoundOn = soundOn;
        soundButton.textContent = soundOn ? 'Audio Off' : 'Audio On';
    }

    // Gestione logo (placeholder fino a quando le immagini non saranno disponibili)
    if (logoImg) {
        // Crea un rettangolo colorato come placeholder
        const canvas = document.createElement('canvas');
        canvas.width = 120;
        canvas.height = 60;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#006400';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Aggiungi testo al placeholder
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Fiera Venticano', canvas.width/2, canvas.height/2);
        logoImg.src = canvas.toDataURL();
    }

    // Esponi le funzioni e le proprietà necessarie all'esterno
    return {
        renderGame,
        renderNextPiece,
        updateScore,
        updateLevel,
        updateTheme,
        showGameOver,
        hideGameOver,
        setupInputListeners,
        setPlayAgainCallback,
        setSubmitCallback,
        setPauseToggleCallback,
        setSoundToggleCallback,
        updatePauseButton,
        updateSoundButton,
        createLineClearParticles
    };
};