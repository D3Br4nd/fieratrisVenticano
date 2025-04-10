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
        // Previene completamente la propagazione degli eventi tastiera dall'input
        playerNameInput.addEventListener('keydown', function(e) {
            e.stopPropagation();
        }, true);
        
        playerNameInput.addEventListener('keyup', function(e) {
            e.stopPropagation();
        }, true);
        
        playerNameInput.addEventListener('keypress', function(e) {
            e.stopPropagation();
        }, true);
    }
    
    // Funzione per controllare se l'input è attivo
    function isInputActive() {
        return isGameOverVisible && document.activeElement === playerNameInput;
    }
    
    // Rendi la funzione accessibile globalmente
    window.isInputActive = isInputActive;
    
    // Osservatore per monitorare quando il game over diventa visibile o nascosto
    if (gameOverScreen) {
        isGameOverVisible = gameOverScreen.style.display === 'flex';
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.attributeName === 'style') {
                    const isVisible = gameOverScreen.style.display === 'flex';
                    
                    if (isVisible !== isGameOverVisible) {
                        isGameOverVisible = isVisible;
                        console.log('Game over visibility changed:', isVisible);
                        
                        if (isVisible) {
                            // Quando il popup è visibile, pulisci l'input e metti il focus
                            setTimeout(() => {
                                playerNameInput.value = '';
                                playerNameInput.focus();
                            }, 100);
                        }
                    }
                }
            });
        });
        
        // Avvia l'osservazione delle modifiche allo stile del game over screen
        observer.observe(gameOverScreen, { attributes: true });
    }


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
                    const color = isShadow ? 'rgba(0,0,0,0.2)' : piece.color;
                    drawBlock(context, offsetX + x, offsetY + y, color, blockSize);
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
        
        // Draw shadow first
        if (gameState.currentPiece && gameState.shadowY !== undefined) {
            drawPiece(ctx, gameState.currentPiece, gameState.pieceX, gameState.shadowY, BLOCK_SIZE, true);
        }
        
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
        
        // Cambia sfondo in base al livello
        const themes = [
            'enogastronomia',     // Livello 1
            'bioedilizia',        // Livello 2
            'arredamenti',        // Livello 3
            'energie_rinnovabili', // Livello 4
            'vivaistica',         // Livello 5
            'agricoltura',        // Livello 6
            'tecnologia',         // Livello 7
            'artigianato',        // Livello 8
            'turismo',            // Livello 9
            'finale_fiera'        // Livello 10
        ];
        // Usa direttamente il livello come indice (sottraendo 1 perché gli array partono da 0)
        const themeIndex = Math.min(level - 1, themes.length - 1);
        const theme = themes[themeIndex];
        
        // Funzione per generare uno sfondo colorato alternativo
        const generateBackgroundFallback = (themeName) => {
            // Mappa dei colori per i temi
            const themeColors = {
                'enogastronomia': '#8BC34A',      // Verde chiaro
                'bioedilizia': '#795548',        // Marrone
                'arredamenti': '#FF9800',        // Arancione
                'energie_rinnovabili': '#03A9F4',// Azzurro
                'vivaistica': '#4CAF50',         // Verde
                'agricoltura': '#689F38',        // Verde oliva
                'tecnologia': '#2196F3',         // Blu
                'artigianato': '#E65100',        // Arancione scuro
                'turismo': '#9C27B0',           // Viola
                'finale_fiera': '#FFC107'        // Giallo dorato
            };
            
            // Fallback color se il tema non è nella mappa
            return themeColors[themeName] || '#333333';
        };
        
        // Prova a caricare l'immagine di sfondo
        const img = new Image();
        img.onload = () => {
            // Immagine caricata con successo, applica lo sfondo
            canvas.style.backgroundImage = `url('assets/img/sfondi/${theme}.jpg')`;
            canvas.style.backgroundSize = 'cover';
        };
        img.onerror = () => {
            // Immagine non trovata, usa il colore di fallback
            console.warn(`Background image for theme '${theme}' not found, using color fallback`);
            canvas.style.backgroundImage = 'none';
            canvas.style.backgroundColor = generateBackgroundFallback(theme);
        };
        img.src = `assets/img/sfondi/${theme}.jpg`;
    }

    // --- Gestione UI Interattiva ---

    function showGameOver(score) {
        finalScoreElement.textContent = score;
        gameOverScreen.style.display = 'flex'; // Mostra schermo
        
        // Fix per l'input quando si apre la schermata di Game Over
        setTimeout(() => {
            // Pulisci il valore dell'input
            playerNameInput.value = '';
            
            // Applica focus all'input del nome
            playerNameInput.focus();
        }, 100);
    }

    function hideGameOver() {
        gameOverScreen.style.display = 'none';
        playerNameInput.value = ''; // Pulisci input
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

    // Gestione logo
    if (logoImg) {
        logoImg.onerror = function() {
            console.log('Logo image not found, using placeholder');
            // Create a colored rectangle as placeholder
            const canvas = document.createElement('canvas');
            canvas.width = 120;
            canvas.height = 60;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#006400';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            logoImg.src = canvas.toDataURL();
        };
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