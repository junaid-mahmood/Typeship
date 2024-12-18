class Game {
    constructor(assets) {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        this.assets = assets || { loaded: false, images: {}, sounds: {} };
        this.particles = new ParticleSystem();
        this.player = new PlayerShip(this);
        
        this.enemyShips = [];
        this.score = 0;
        this.gameOver = false;
        this.level = 1;
        
        this.spawnInterval = 4000;
        this.lastSpawnTime = Date.now();
        this.baseSpeed = 1.0;
        this.motherShipChance = 0.1;
        
        this.baseMotherShipChance = 0.1;
        this.maxMotherShipChance = 0.2;
        
        this.regularWords = [
            'sail', 'ship', 'wave', 'crew', 'deck',
            'port', 'helm', 'mast', 'wind', 'rope'
        ];
        
        this.motherShipWords = [
            'battleship', 'destroyer', 'submarine',
            'navigator', 'caribbean', 'treasure',
            'hurricane', 'kraken', 'leviathan',
            'privateer', 'lighthouse'
        ];
        
        this.currentTarget = null;
        
        this.setupEventListeners();
        
        this.spawnShip();
        
        this.activeProjectiles = [];
        this.shipsDestroyed = 0;
        this.totalKeystrokes = 0;
        this.correctKeystrokes = 0;
        this.accuracy = 100;
        
        this.initComboSystem();
        this.initPowerUpSystem();
        this.initWeatherSystem();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (this.gameOver) return;
            
            if (e.key.length === 1) {
                this.handleKeyPress(e.key.toLowerCase());
            }
        });

        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.player.x = this.canvas.width / 2 - this.player.width / 2;
            this.player.y = this.canvas.height - this.player.height - 20;
        });
    }

    handleKeyPress(key) {
        this.totalKeystrokes++;
        
        for (let ship of this.enemyShips) {
            if (ship instanceof MotherShip) {
                for (let i = ship.projectiles.length - 1; i >= 0; i--) {
                    const proj = ship.projectiles[i];
                    if (proj.char === key) {
                        ship.projectiles.splice(i, 1);
                        this.score += 50;
                        this.particles.createExplosion(proj.x, proj.y, '#4CAF50');
                        return;
                    }
                }
            }
        }

        if (!this.currentTarget) {
            for (let ship of this.enemyShips) {
                if (!ship.destroyed && 
                    ship.word[0].toLowerCase() === key.toLowerCase()) {
                    this.correctKeystrokes++;
                    this.currentTarget = ship;
                    ship.typed = key;
                    if (!ship.scopeAnimationDone) {
                        ship.showTargetingScope = true;
                        ship.scopeStartTime = Date.now();
                    }
                    this.player.fireAtProgress(ship);
                    break;
                }
            }
        } else {
            if (!this.currentTarget.destroyed && 
                this.currentTarget.word[this.currentTarget.typed.length].toLowerCase() === key.toLowerCase()) {
                this.correctKeystrokes++;
                if (this.currentTarget.typed.length === 0 && !this.currentTarget.scopeAnimationDone) {
                    this.currentTarget.showTargetingScope = true;
                    this.currentTarget.scopeStartTime = Date.now();
                }
                this.currentTarget.typed += key;
                this.player.fireAtProgress(this.currentTarget);
                
                if (this.currentTarget.typed === this.currentTarget.word) {
                    this.score += Math.floor(this.currentTarget instanceof MotherShip ? 200 : 100 * this.level);
                    this.shipsDestroyed++;
                    this.checkLevelProgression();
                }
            }
        }
        
        this.accuracy = Math.round((this.correctKeystrokes / this.totalKeystrokes) * 100);
    }

    checkLevelProgression() {
        const newLevel = Math.floor(this.score / 1000) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            this.spawnInterval = Math.max(2000, 4000 - (this.level * 150));
            this.baseSpeed = Math.min(1.5, 0.5 + (this.level * 0.08));
            
            this.motherShipChance = Math.min(
                this.maxMotherShipChance,
                this.baseMotherShipChance + (this.level * 0.02)
            );
        }
    }

    spawnShip() {
        const isMotherShip = Math.random() < this.motherShipChance;
        const wordList = isMotherShip ? this.motherShipWords : this.regularWords;
        const word = wordList[Math.floor(Math.random() * wordList.length)];
        
        const x = Math.random() * (this.canvas.width - 100);
        const speed = this.baseSpeed * (Math.random() * 0.4 + 0.8);
        
        const ship = isMotherShip ?
            new MotherShip(word, x, -50, speed, this) :
            new EnemyShip(word, x, -50, speed, this);
            
        this.enemyShips.push(ship);
    }

    update() {
        if (this.gameOver) return;

        const currentTime = Date.now();
        if (currentTime - this.lastSpawnTime > this.spawnInterval) {
            this.spawnShip();
            this.lastSpawnTime = currentTime;
        }

        this.player.update();

        this.particles.update();

        for (let i = this.enemyShips.length - 1; i >= 0; i--) {
            const ship = this.enemyShips[i];
            ship.update();
            
            if (this.checkCollision(ship, this.player)) {
                this.player.takeDamage();
                if (this.player.lives <= 0) {
                    this.gameOver = true;
                    break;
                }
            }
            
            if (ship.y > this.canvas.height + 100) {
                if (ship === this.currentTarget) {
                    this.currentTarget = null;
                }
                this.enemyShips.splice(i, 1);
                continue;
            }
            
            if (ship.destroyed && !this.player.projectiles.some(p => !p.hasHitTarget)) {
                if (ship === this.currentTarget) {
                    this.currentTarget = null;
                }
                this.enemyShips.splice(i, 1);
            }
        }

        for (let i = this.activeProjectiles.length - 1; i >= 0; i--) {
            const proj = this.activeProjectiles[i];
            proj.update();
            
            if (proj.y > this.player.y && 
                proj.x > this.player.x && 
                proj.x < this.player.x + this.player.width) {
                this.player.takeDamage();
                this.activeProjectiles.splice(i, 1);
                
                if (this.player.lives <= 0) {
                    this.gameOver = true;
                }
                continue;
            }

            if (proj.y > this.canvas.height) {
                this.activeProjectiles.splice(i, 1);
            }
        }
    }

    draw() {
        if (this.assets.loaded && this.assets.images.gameBackground) {
            this.ctx.drawImage(this.assets.images.gameBackground, 0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        } else {
            this.ctx.fillStyle = '#000033';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        this.player.draw(this.ctx);

        this.enemyShips.forEach(ship => ship.draw(this.ctx));

        this.particles.draw(this.ctx);

        this.activeProjectiles.forEach(proj => proj.draw(this.ctx));

        this.drawHUD();
    }

    drawHUD() {
        const padding = 20;
        const panelWidth = 280;
        const panelHeight = 80;
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(
            this.canvas.width - panelWidth - padding,
            padding,
            panelWidth,
            panelHeight
        );

        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '20px "Press Start 2P"';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(
            `Score: ${this.score}`,
            this.canvas.width - padding - 20,
            padding + 30
        );
        this.ctx.fillText(
            `Level: ${this.level}`,
            this.canvas.width - padding - 20,
            padding + 60
        );
    }

    removeShip(ship) {
        if (ship === this.currentTarget) {
            this.currentTarget = null;
        }
        this.enemyShips = this.enemyShips.filter(s => s !== ship);
    }

    checkCollision(ship, player) {
        return (ship.x < player.x + player.width * 0.8 &&
                ship.x + ship.width * 0.8 > player.x &&
                ship.y < player.y + player.height * 0.8 &&
                ship.y + ship.height * 0.8 > player.y);
    }
} 