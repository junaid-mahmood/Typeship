class GameOverScreen {
    constructor(score, highScore) {
        this.score = score;
        this.highScore = highScore;
        this.particles = [];
        this.init();
    }

    init() {
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                speed: 0.5 + Math.random() * 1,
                size: 10 + Math.random() * 20,
                text: '+' + Math.floor(Math.random() * 100) * 10
            });
        }
    }

    update() {
        this.particles.forEach(p => {
            p.y -= p.speed;
            if (p.y < -50) p.y = window.innerHeight + 50;
        });
    }

    draw(ctx) {
        ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
        this.particles.forEach(p => {
            ctx.font = `${p.size}px "Press Start 2P"`;
            ctx.fillText(p.text, p.x, p.y);
        });
    }
} 