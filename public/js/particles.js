class ParticleSystem {
    constructor() {
        this.particles = [];
        this.explosions = [];
        this.trails = [];
        this.textEffects = [];
        this.debrisParticles = [];
        this.energyFields = [];
        
        this.presets = {
            fire: {
                colors: ['#ff4400', '#ff8800', '#ffaa00'],
                size: { min: 2, max: 4 },
                life: { min: 0.3, max: 0.7 },
                speed: { min: 1, max: 3 }
            },
            spark: {
                colors: ['#ffff00', '#ffaa00', '#ff0000'],
                size: { min: 1, max: 2 },
                life: { min: 0.2, max: 0.4 },
                speed: { min: 3, max: 6 }
            },
            shield: {
                colors: ['#00ffff', '#0088ff', '#0044ff'],
                size: { min: 2, max: 3 },
                life: { min: 0.5, max: 0.8 },
                speed: { min: 1, max: 2 }
            }
        };
    }

    createExplosion(x, y, color, count = 20) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i;
            const speed = Math.random() * 2 + 2;
            const size = Math.random() * 3 + 2;
            const life = Math.random() * 0.5 + 0.5;
            const rotationSpeed = (Math.random() - 0.5) * 0.2;

            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size,
                color,
                life,
                maxLife: life,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed
            });
        }

        this.explosions.push({
            x,
            y,
            radius: 0,
            maxRadius: 50,
            life: 1,
            color
        });

        this.createDebris(x, y, color, Math.floor(count / 2));
    }

    createDebris(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 + 1;
            const rotationSpeed = (Math.random() - 0.5) * 0.4;
            const size = Math.random() * 4 + 2;

            this.debrisParticles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size,
                color,
                life: 1,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed,
                gravity: 0.1
            });
        }
    }

    createEnergyField(x, y, radius, color) {
        this.energyFields.push({
            x,
            y,
            radius,
            maxRadius: radius * 1.2,
            minRadius: radius * 0.8,
            color,
            life: 1,
            pulseSpeed: 0.05,
            expanding: true
        });
    }

    createTrail(x, y, color) {
        this.trails.push({
            x,
            y,
            size: Math.random() * 2 + 1,
            color,
            life: 1
        });
    }

    createTextEffect(x, y, text, color, size = 20) {
        this.textEffects.push({
            x,
            y,
            text,
            color,
            size,
            life: 1,
            vy: -2,
            fadeSpeed: 0.02
        });
    }

    createParticleEffect(x, y, preset, count = 10) {
        const settings = this.presets[preset];
        if (!settings) return;

        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 
                (settings.speed.max - settings.speed.min) + 
                settings.speed.min;
            
            const color = settings.colors[
                Math.floor(Math.random() * settings.colors.length)
            ];
            
            const size = Math.random() * 
                (settings.size.max - settings.size.min) + 
                settings.size.min;
            
            const life = Math.random() * 
                (settings.life.max - settings.life.min) + 
                settings.life.min;

            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size,
                color,
                life,
                maxLife: life,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.2
            });
        }
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.98;
            p.vy *= 0.98;
            p.life -= 0.02;
            p.rotation += p.rotationSpeed;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        for (let i = this.debrisParticles.length - 1; i >= 0; i--) {
            const d = this.debrisParticles[i];
            d.x += d.vx;
            d.y += d.vy;
            d.vy += d.gravity;
            d.rotation += d.rotationSpeed;
            d.life -= 0.01;

            if (d.life <= 0) {
                this.debrisParticles.splice(i, 1);
            }
        }

        for (let i = this.energyFields.length - 1; i >= 0; i--) {
            const e = this.energyFields[i];
            if (e.expanding) {
                e.radius += e.pulseSpeed;
                if (e.radius >= e.maxRadius) {
                    e.expanding = false;
                }
            } else {
                e.radius -= e.pulseSpeed;
                if (e.radius <= e.minRadius) {
                    e.expanding = true;
                }
            }
            e.life -= 0.01;

            if (e.life <= 0) {
                this.energyFields.splice(i, 1);
            }
        }

        for (let i = this.textEffects.length - 1; i >= 0; i--) {
            const t = this.textEffects[i];
            t.y += t.vy;
            t.life -= t.fadeSpeed;

            if (t.life <= 0) {
                this.textEffects.splice(i, 1);
            }
        }

        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const e = this.explosions[i];
            e.radius += (e.maxRadius - e.radius) * 0.1;
            e.life -= 0.05;

            if (e.life <= 0) {
                this.explosions.splice(i, 1);
            }
        }

        for (let i = this.trails.length - 1; i >= 0; i--) {
            const t = this.trails[i];
            t.life -= 0.05;

            if (t.life <= 0) {
                this.trails.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        this.trails.forEach(t => {
            ctx.globalAlpha = t.life;
            ctx.fillStyle = t.color;
            ctx.beginPath();
            ctx.arc(t.x, t.y, t.size, 0, Math.PI * 2);
            ctx.fill();
        });

        this.particles.forEach(p => {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
            ctx.restore();
        });

        this.explosions.forEach(e => {
            ctx.strokeStyle = e.color;
            ctx.globalAlpha = e.life * 0.5;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
            ctx.stroke();
        });

        this.debrisParticles.forEach(d => {
            ctx.save();
            ctx.translate(d.x, d.y);
            ctx.rotate(d.rotation);
            ctx.globalAlpha = d.life;
            ctx.fillStyle = d.color;
            ctx.fillRect(-d.size/2, -d.size/2, d.size, d.size);
            ctx.restore();
        });

        this.energyFields.forEach(e => {
            ctx.strokeStyle = e.color;
            ctx.globalAlpha = e.life * 0.5;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
            ctx.stroke();
        });

        this.textEffects.forEach(t => {
            ctx.globalAlpha = t.life;
            ctx.fillStyle = t.color;
            ctx.font = `${t.size}px "Press Start 2P"`;
            ctx.textAlign = 'center';
            ctx.fillText(t.text, t.x, t.y);
        });

        ctx.globalAlpha = 1;
    }
} 