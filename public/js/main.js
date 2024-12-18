let game;
const assets = new AssetLoader();

const GameStateManager = {
    currentState: 'menu',
    previousState: null,
    stateStack: [],
    
    states: {
        menu: {
            update: () => {},
            draw: () => {}
        },
        playing: {
            update: () => game && game.update(),
            draw: () => game && game.draw()
        },
        paused: {
            update: () => {},
            draw: () => game && game.draw()
        },
        gameOver: {
            update: () => {},
            draw: () => {}
        }
    },

    pushState: function(state) {
        this.stateStack.push(this.currentState);
        this.previousState = this.currentState;
        this.currentState = state;
    },

    popState: function() {
        if (this.stateStack.length > 0) {
            this.currentState = this.stateStack.pop();
            this.previousState = this.stateStack[this.stateStack.length - 1];
        }
    }
};

const TransitionManager = {
    transitions: {
        fade: {
            duration: 1000,
            create: () => {
                const overlay = document.createElement('div');
                overlay.style.position = 'fixed';
                overlay.style.top = '0';
                overlay.style.left = '0';
                overlay.style.width = '100%';
                overlay.style.height = '100%';
                overlay.style.backgroundColor = 'black';
                overlay.style.transition = 'opacity 1s';
                return overlay;
            }
        },
        glitch: {
            duration: 500,
            create: () => {
                const overlay = document.createElement('div');
                overlay.className = 'glitch-transition';
                return overlay;
            }
        }
    },

    executeTransition: async function(type, callback) {
        const transition = this.transitions[type];
        if (!transition) return callback();

        const element = transition.create();
        document.body.appendChild(element);

        if (type === 'fade') {
            element.style.opacity = '0';
            await new Promise(resolve => setTimeout(resolve, 50));
            element.style.opacity = '1';
        }

        await new Promise(resolve => setTimeout(resolve, transition.duration));
        callback();
        
        if (type === 'fade') {
            element.style.opacity = '0';
            await new Promise(resolve => setTimeout(resolve, transition.duration));
        }
        
        document.body.removeChild(element);
    }
};

const InputBuffer = {
    buffer: [],
    maxBufferSize: 10,
    bufferTimeout: 1000,
    lastInputTime: 0,

    addInput: function(key) {
        const currentTime = Date.now();
        if (currentTime - this.lastInputTime > this.bufferTimeout) {
            this.buffer = [];
        }

        this.buffer.push({
            key,
            timestamp: currentTime
        });

        if (this.buffer.length > this.maxBufferSize) {
            this.buffer.shift();
        }

        this.lastInputTime = currentTime;
        this.checkCombos();
    },

    checkCombos: function() {
        const sequence = this.buffer.map(input => input.key).join('');
        
        if (sequence.endsWith('upupdowndown')) {
            console.log('Konami code partial match!');
        }
    }
};

const Analytics = {
    events: [],
    
    logEvent: function(eventName, data) {
        const event = {
            timestamp: Date.now(),
            name: eventName,
            data: data
        };
        
        this.events.push(event);
        
        if (this.events.length > 1000) {
            this.events.shift();
        }

        this.sendToServer(event);
    },

    sendToServer: async function(event) {
        try {
            await fetch('/api/analytics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(event)
            });
        } catch (error) {
            console.error('Failed to send analytics:', error);
        }
    },

    getStats: function() {
        return {
            totalEvents: this.events.length,
            eventTypes: this.events.reduce((acc, event) => {
                acc[event.name] = (acc[event.name] || 0) + 1;
                return acc;
            }, {})
        };
    }
};

function startGame() {
    Analytics.logEvent('gameStart', { timestamp: Date.now() });
    
    TransitionManager.executeTransition('glitch', () => {
        document.getElementById('startScreen').classList.add('hidden');
        
        setTimeout(() => {
            if (!game) {
                console.log("Creating new game instance...");
                game = new Game(assets);
            } else {
                console.log("Resetting game...");
                game = new Game(assets);
            }
            
            GameStateManager.pushState('playing');
            gameLoop();
        }, 300);
    });
}

function gameLoop() {
    const currentState = GameStateManager.states[GameStateManager.currentState];
    
    if (currentState) {
        currentState.update();
        currentState.draw();
    }

    if (GameStateManager.currentState === 'playing' && !game.gameOver) {
        requestAnimationFrame(gameLoop);
    } else if (game.gameOver) {
        showGameOver();
    }
}

function showGameOver() {
    Analytics.logEvent('gameOver', {
        score: game.score,
        level: game.level,
        accuracy: game.accuracy
    });

    const gameStats = {
        score: game.score,
        shipsDestroyed: game.shipsDestroyed,
        level: game.level,
        accuracy: game.accuracy,
        highScore: Math.max(localStorage.getItem('highScore') || 0, game.score)
    };
    
    localStorage.setItem('gameStats', JSON.stringify(gameStats));
    localStorage.setItem('highScore', gameStats.highScore);

    TransitionManager.executeTransition('fade', () => {
        window.location.href = '/gameover.html';
    });
}

window.onload = async () => {
    console.log("Window loaded, initializing assets...");
    await assets.loadAssets();
    console.log("Assets loaded, setting up event listeners...");
    
    document.addEventListener('keydown', (event) => {
        InputBuffer.addInput(event.key);

        if (event.code === 'Space') {
            event.preventDefault();
            if (!game || game.gameOver) {
                startGame();
            }
        } else if (event.code === 'Escape') {
            if (GameStateManager.currentState === 'playing') {
                GameStateManager.pushState('paused');
            } else if (GameStateManager.currentState === 'paused') {
                GameStateManager.popState();
            }
        }
    });
    
    const howToPlayButton = document.querySelector('.menu-button');
    if (howToPlayButton) {
        howToPlayButton.addEventListener('click', toggleInstructions);
    }

    Analytics.logEvent('gameLoaded', {
        timestamp: Date.now(),
        screenSize: {
            width: window.innerWidth,
            height: window.innerHeight
        }
    });
};

window.toggleInstructions = function() {
    const instructions = document.getElementById('instructions');
    if (instructions) {
        instructions.classList.toggle('hidden');
        Analytics.logEvent('instructionsToggled', {
            visible: !instructions.classList.contains('hidden')
        });
    }
};

window.onerror = function(message, source, lineno, colno, error) {
    Analytics.logEvent('error', {
        message,
        source,
        lineno,
        colno,
        stack: error?.stack
    });

    if (game && !game.gameOver) {
        console.log('Attempting to recover from error...');
        try {
            game = new Game(assets);
            GameStateManager.pushState('playing');
            gameLoop();
        } catch (e) {
            console.error('Failed to recover from error:', e);
            showGameOver();
        }
    }
};

// New Feature: Game Pause and Resume
function togglePause() {
    if (GameStateManager.currentState === 'playing') {
        GameStateManager.pushState('paused');
        console.log('Game paused');
    } else if (GameStateManager.currentState === 'paused') {
        GameStateManager.popState();
        console.log('Game resumed');
    }
}

// New Feature: Save and Load Game State
function saveGameState() {
    const state = {
        score: game.score,
        level: game.level,
        playerPosition: { x: game.player.x, y: game.player.y },
        enemyShips: game.enemyShips.map(ship => ({
            word: ship.word,
            x: ship.x,
            y: ship.y,
            speed: ship.speed
        }))
    };
    localStorage.setItem('savedGameState', JSON.stringify(state));
    console.log('Game state saved');
}

function loadGameState() {
    const savedState = JSON.parse(localStorage.getItem('savedGameState'));
    if (savedState) {
        game.score = savedState.score;
        game.level = savedState.level;
        game.player.x = savedState.playerPosition.x;
        game.player.y = savedState.playerPosition.y;
        game.enemyShips = savedState.enemyShips.map(data => new EnemyShip(data.word, data.x, data.y, data.speed, game));
        console.log('Game state loaded');
    } else {
        console.log('No saved game state found');
    }
}

// New Feature: Fullscreen Toggle
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
    } else {
        document.exitFullscreen();
    }
}

document.addEventListener('keydown', (event) => {
    if (event.code === 'KeyF') {
        toggleFullscreen();
    }
    if (event.code === 'KeyP') {
        togglePause();
    }
    if (event.code === 'KeyS') {
        saveGameState();
    }
    if (event.code === 'KeyL') {
        loadGameState();
    }
}); 