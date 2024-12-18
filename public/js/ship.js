class PlayerShip {
    constructor(game) {
        this.game = game;
        this.width = 150;
        this.height = 112;
        this.x = game.canvas.width / 2 - this.width / 2;
        this.y = game.canvas.height - this.height - 20;
        this.projectiles = [];
        this.lives = 2;
        this.isHurt = false;
        this.hurtTime = 0;
        this.hurtDuration = 1000;
    }

    fireAt(targetShip) {
        const projectile = new Projectile(
            this.x + this.width / 2,
            this.y,
            targetShip.x + targetShip.width / 2,
            targetShip.y + targetShip.height / 2
        );
        this.projectiles.push(projectile);
        
        this.game.particles.createExplosion(
            targetShip.x + targetShip.width/2, 
            targetShip.y + targetShip.height/2
        );
    }

    fireAtProgress(targetShip) {
        const progressRatio = targetShip.typed.length / targetShip.word.length;
        const targetX = targetShip.x + (targetShip.width * progressRatio);
        
        const projectile = new Projectile(
            this.x + this.width / 2,
            this.y,
            targetX,
            targetShip.y + targetShip.height / 2,
            this.game
        );
        
        this.projectiles.push(projectile);
        
        if (targetShip.typed.length < targetShip.word.length - 1) {
            this.game.particles.createExplosion(
                targetX,
                targetShip.y + targetShip.height / 2,
                '#FFA500'
            );
        }
    }

    update() {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            projectile.update();
            
            if (projectile.hasHitTarget && this.game.currentTarget && 
                this.game.currentTarget.typed === this.game.currentTarget.word) {
                this.game.currentTarget.destroy();
                this.projectiles.splice(i, 1);
            } else if (projectile.hasReachedTarget) {
                this.projectiles.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        if (this.isHurt) {
            const timeSinceHurt = Date.now() - this.hurtTime;
            if (timeSinceHurt < this.hurtDuration) {
                const flashIntensity = Math.sin(timeSinceHurt / 50) * 0.5 + 0.5;
                ctx.fillStyle = `rgba(255, 0, 0, ${flashIntensity * 0.5})`;
                ctx.fillRect(this.x, this.y, this.width, this.height);
            } else {
                this.isHurt = false;
            }
        }

        if (this.game.assets.loaded && this.game.assets.images.playerShip) {
            ctx.drawImage(
                this.game.assets.images.playerShip,
                this.x,
                this.y,
                this.width,
                this.height
            );
        } else {
            ctx.fillStyle = '#4CAF50';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
        
        const heartSize = 30;
        const heartSpacing = 40;
        const heartsY = 35;
        
        const panelWidth = (heartSpacing * this.lives) + 20;
        const panelHeight = heartSize + 20;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(20, 10, panelWidth, panelHeight);
        
        for (let i = 0; i < this.lives; i++) {
            if (this.game.assets.loaded && this.game.assets.images.heart) {
                ctx.drawImage(
                    this.game.assets.images.heart,
                    30 + (i * heartSpacing),
                    heartsY - heartSize/2,
                    heartSize,
                    heartSize
                );
            } else {
                ctx.fillStyle = '#FF4444';
                ctx.beginPath();
                ctx.arc(30 + (i * heartSpacing), heartsY, 10, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        this.projectiles.forEach(projectile => projectile.draw(ctx));
    }

    takeDamage() {
        this.lives--;
        this.isHurt = true;
        this.hurtTime = Date.now();
        this.game.particles.createExplosion(
            this.x + this.width/2,
            this.y + this.height/2,
            '#FF0000',
            30
        );

        if (this.lives <= 0) {
            this.game.gameOver = true;
            showGameOver();
        }
    }
}

class EnemyShip {
    constructor(word, x, y, speed, game) {
        this.word = word;
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.game = game;
        this.typed = '';
        this.width = 130;
        this.height = 97;
        this.destroyed = false;
        this.progressExplosions = [];
        
        this.startX = x;
        this.amplitude = 100;
        this.frequency = 0.035;
        this.time = Math.random() * Math.PI * 2;
        this.showTargetingScope = false;
        this.scopeStartTime = 0;
        this.scopeDuration = 800;
        this.scopeAnimationDone = false;
        this.scopeStartScale = 1.5;
    }

    draw(ctx) {
        if (this.game.assets.loaded && this.game.assets.images.enemyShip) {
            ctx.drawImage(
                this.game.assets.images.enemyShip,
                this.x,
                this.y,
                this.width,
                this.height
            );
        } else {
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
        
        if (this.showTargetingScope && !this.scopeAnimationDone) {
            const progress = (Date.now() - this.scopeStartTime) / this.scopeDuration;
            
            if (progress <= 1) {
                const centerX = this.x + this.width/2;
                const centerY = this.y + this.height/2;
                const maxRadius = Math.min(this.width, this.height) * 0.8;
                
                const scale = (1 - progress) * this.scopeStartScale;
                
                ctx.save();
                ctx.translate(centerX, centerY);
                ctx.scale(scale, scale);
                
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 2;
                
                ctx.beginPath();
                ctx.arc(0, 0, maxRadius, 0, Math.PI * 2);
                ctx.stroke();
                
                const lineLength = maxRadius * 0.3;
                
                ctx.beginPath();
                ctx.moveTo(0, -maxRadius);
                ctx.lineTo(0, -lineLength);
                ctx.moveTo(0, lineLength);
                ctx.lineTo(0, maxRadius);
                ctx.stroke();
                
                ctx.beginPath();
                ctx.moveTo(-maxRadius, 0);
                ctx.lineTo(-lineLength, 0);
                ctx.moveTo(lineLength, 0);
                ctx.lineTo(maxRadius, 0);
                ctx.stroke();
                
                ctx.restore();
            } else {
                this.scopeAnimationDone = true;
            }
        }
        
        ctx.font = '20px Arial';
        const word = this.word;
        const totalWidth = ctx.measureText(word).width;
        const startX = this.x + (this.width - totalWidth) / 2;
        
        for (let i = 0; i < word.length; i++) {
            const letter = word[i];
            const letterWidth = ctx.measureText(letter).width;
            const x = startX + ctx.measureText(word.substring(0, i)).width;
            
            if (this.game.currentTarget === this) {
                if (i < this.typed.length) {
                    ctx.fillStyle = '#FF9933';
                } else if (i === this.typed.length) {
                    ctx.fillStyle = '#FFD700';
                } else {
                    ctx.fillStyle = '#FFFFFF';
                }
            } else {
                ctx.fillStyle = '#FFFFFF';
            }
            
            ctx.textAlign = 'left';
            ctx.fillText(letter, x, this.y + this.height + 25);
        }
    }

    update() {
        this.y += this.speed * 0.8;
        
        this.x = this.startX + Math.sin(this.time) * this.amplitude;
        this.time += this.frequency;
        
        const maxX = this.game.canvas.width - this.width;
        this.x = Math.max(0, Math.min(this.x, maxX));
    }

    destroy() {
        this.destroyed = true;
        this.game.particles.createExplosion(this.x + this.width/2, this.y + this.height/2);
    }
}

class Projectile {
    constructor(startX, startY, targetX, targetY, game) {
        this.x = startX;
        this.y = startY;
        this.targetX = targetX;
        this.targetY = targetY;
        this.game = game;
        this.speed = 30;
        this.hasReachedTarget = false;
        this.hasHitTarget = false;
        this.width = 40;
        this.height = 40;
        
        const dx = targetX - startX;
        const dy = targetY - startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        this.velocityX = (dx / distance) * this.speed;
        this.velocityY = (dy / distance) * this.speed;
        
        this.rotation = Math.atan2(dy, dx) + Math.PI/2;
    }

    update() {
        this.x += this.velocityX;
        this.y += this.velocityY;
        
        if (Math.abs(this.x - this.targetX) < this.speed/2 && 
            Math.abs(this.y - this.targetY) < this.speed/2) {
            this.hasHitTarget = true;
            this.hasReachedTarget = true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        if (this.game && this.game.assets.loaded && this.game.assets.images.bullet) {
            ctx.drawImage(
                this.game.assets.images.bullet,
                -this.width/2,
                -this.height/2,
                this.width,
                this.height
            );
        } else {
            ctx.fillStyle = '#FFA500';
            ctx.beginPath();
            ctx.arc(0, 0, 8, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#FFA500';
            ctx.fill();
        }
        
        ctx.restore();
    }
}

class EnemyProjectile {
    constructor(x, y, char, spreadX, game) {
        this.x = x;
        this.y = y;
        this.char = char;
        this.game = game;
        this.speed = 1.5;
        this.velocityX = spreadX * this.speed;
        this.velocityY = this.speed * 1.2;
        this.width = 24;
        this.height = 24;
        
        this.rotation = Math.atan2(this.velocityY, this.velocityX) + Math.PI/2;
    }

    update() {
        this.x += this.velocityX;
        this.y += this.velocityY;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        if (this.game && this.game.assets.loaded && this.game.assets.images.missile) {
            ctx.drawImage(
                this.game.assets.images.missile,
                -this.width/2,
                -this.height/2,
                this.width,
                this.height
            );
        } else {
            ctx.fillStyle = '#FF4444';
            ctx.beginPath();
            ctx.arc(0, 0, 10, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.char, this.x, this.y);
    }
} 

class MotherShip extends EnemyShip {
    constructor(word, x, y, speed, game) {
        super(word, x, y, speed, game);
        this.width = 150;
        this.height = 100;
        this.projectiles = [];
        this.lastShot = Date.now() - 6000;
        this.shotInterval = 8000;
        this.characters = 'abcdefghijklmnopqrstuvwxyz'.split('');
        this.firstShot = true;
        
        this.amplitude = 150;
        this.frequency = 0.025;
        this.verticalAmplitude = 40;
        this.verticalTime = Math.random() * Math.PI * 2;
    }

    update() {
        this.y += this.speed * 0.5;
        
        this.x = this.startX + Math.sin(this.time) * this.amplitude;
        this.time += this.frequency;
        
        this.y += Math.sin(this.verticalTime) * 0.8;
        this.verticalTime += 0.03;
        
        const maxX = this.game.canvas.width - this.width;
        this.x = Math.max(0, Math.min(this.x, maxX));
        
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            this.projectiles[i].update();
            
            const proj = this.projectiles[i];
            const player = this.game.player;
            if (proj.y > player.y && 
                proj.x > player.x && 
                proj.x < player.x + player.width) {
                player.takeDamage();
                this.projectiles.splice(i, 1);
                continue;
            }

            if (proj.y > this.game.canvas.height) {
                this.projectiles.splice(i, 1);
            }
        }
        
        const currentTime = Date.now();
        if (this.firstShot && currentTime - this.lastShot > 2000) {
            this.fireProjectiles();
            this.lastShot = currentTime;
            this.firstShot = false;
        } else if (!this.firstShot && currentTime - this.lastShot > this.shotInterval) {
            this.fireProjectiles();
            this.lastShot = currentTime;
        }
    }

    fireProjectiles() {
        const numProjectiles = 5;
        const spacing = this.width / (numProjectiles + 1);
        
        for (let i = 0; i < numProjectiles; i++) {
            const char = this.characters[Math.floor(Math.random() * this.characters.length)];
            
            const spreadX = (Math.random() - 0.5) * 2;
            
            const projectile = new EnemyProjectile(
                this.x + spacing * (i + 1),
                this.y + this.height,
                char,
                spreadX,
                this.game
            );
            
            this.projectiles.push(projectile);
        }
    }

    destroy() {
        this.destroyed = true;
        this.game.particles.createExplosion(this.x + this.width/2, this.y + this.height/2);
        if (this.projectiles.length > 0) {
            this.game.activeProjectiles.push(...this.projectiles);
            this.projectiles = [];
        }
    }

    draw(ctx) {
        if (!this.destroyed) {
            if (this.game.assets.loaded && this.game.assets.images.motherShip) {
                ctx.drawImage(
                    this.game.assets.images.motherShip,
                    this.x,
                    this.y,
                    this.width,
                    this.height
                );
            } else {
                ctx.fillStyle = '#AA0000';
                ctx.fillRect(this.x, this.y, this.width, this.height);
            }
            
            if (this.game.currentTarget === this) {
                const circleTime = Date.now() % 500 / 500;
                const maxRadius = Math.min(this.width, this.height) * 0.8;
                const radius = maxRadius * (1 - circleTime);
                const centerX = this.x + this.width/2;
                const centerY = this.y + this.height/2;
                
                ctx.beginPath();
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 2;
                
                ctx.beginPath();
                ctx.arc(centerX, centerY, maxRadius, 0, Math.PI * 2);
                ctx.stroke();
                
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                ctx.stroke();
                
                const lineLength = maxRadius * 0.3;
                
                ctx.beginPath();
                ctx.moveTo(centerX, centerY - maxRadius);
                ctx.lineTo(centerX, centerY - lineLength);
                ctx.moveTo(centerX, centerY + lineLength);
                ctx.lineTo(centerX, centerY + maxRadius);
                ctx.stroke();
                
                ctx.beginPath();
                ctx.moveTo(centerX - maxRadius, centerY);
                ctx.lineTo(centerX - lineLength, centerY);
                ctx.moveTo(centerX + lineLength, centerY);
                ctx.lineTo(centerX + maxRadius, centerY);
                ctx.stroke();
            }
            
            ctx.font = '24px Arial';
            const word = this.word;
            const totalWidth = ctx.measureText(word).width;
            const startX = this.x + (this.width - totalWidth) / 2;
            
            for (let i = 0; i < word.length; i++) {
                const letter = word[i];
                const letterWidth = ctx.measureText(letter).width;
                const x = startX + ctx.measureText(word.substring(0, i)).width;
                
                if (this.game.currentTarget === this) {
                    if (i < this.typed.length) {
                        ctx.fillStyle = '#FF9933';
                    } else if (i === this.typed.length) {
                        ctx.fillStyle = '#FFD700';
                    } else {
                        ctx.fillStyle = '#FFFFFF';
                    }
                } else {
                    ctx.fillStyle = '#FFFFFF';
                }
                
                ctx.textAlign = 'left';
                ctx.fillText(letter, x, this.y + this.height + 25);
            }
        }
        
        this.projectiles.forEach(proj => proj.draw(ctx));
    }
} 