class AssetLoader {
    constructor() {
        this.images = {};
        this.loaded = false;
    }

    async loadAssets() {
        return new Promise((resolve, reject) => {
            const timestamp = Date.now();
            const imagesToLoad = {
                playerShip: '/images-assets/mainship.png',
                enemyShip: '/images-assets/enemyship.png',
                motherShip: '/images-assets/mothership.png',
                bullet: '/images-assets/bullet.png',
                missile: '/images-assets/missle.png',
                gameBackground: '/images-assets/game.jpg',
                menuBackground: '/images-assets/backg.png',
                heart: '/images-assets/heartt.png'
            };
            
            let loadedImages = 0;
            const totalImages = Object.keys(imagesToLoad).length;
            
            for (const [name, src] of Object.entries(imagesToLoad)) {
                const image = new Image();
                image.src = src + '?' + timestamp;
                
                console.log(`Attempting to load ${name} from:`, image.src);
                
                image.onload = () => {
                    console.log(`Successfully loaded ${name}`);
                    this.images[name] = image;
                    loadedImages++;
                    
                    if (loadedImages === totalImages) {
                        this.loaded = true;
                        resolve();
                    }
                };
                
                image.onerror = (e) => {
                    console.error(`Failed to load ${name}. Error:`, e);
                    console.error('Attempted path:', image.src);
                    this.images[name] = this.createPlaceholderImage(name);
                    loadedImages++;
                    if (loadedImages === totalImages) {
                        this.loaded = true;
                        resolve();
                    }
                };
            }
        });
    }

    createPlaceholderImage(type) {
        const canvas = document.createElement('canvas');
        switch(type) {
            case 'bullet':
                canvas.width = 20;
                canvas.height = 20;
                const bulletCtx = canvas.getContext('2d');
                bulletCtx.fillStyle = '#FFA500';
                bulletCtx.beginPath();
                bulletCtx.arc(10, 10, 4, 0, Math.PI * 2);
                bulletCtx.fill();
                break;
            case 'missile':
                canvas.width = 24;
                canvas.height = 24;
                const missileCtx = canvas.getContext('2d');
                missileCtx.fillStyle = '#FF4444';
                missileCtx.beginPath();
                missileCtx.arc(12, 12, 10, 0, Math.PI * 2);
                missileCtx.fill();
                break;
            default:
                return this.createPlaceholderShip(
                    type === 'motherShip' ? '#AA0000' : 
                    type === 'enemyShip' ? '#8B4513' : '#4CAF50'
                );
        }
        return canvas;
    }

    createPlaceholderShip(color) {
        const canvas = document.createElement('canvas');
        canvas.width = 80;
        canvas.height = 60;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 80, 60);
        return canvas;
    }

    createPlaceholderAssets() {
        this.images = {
            playerShip: this.createPlaceholderShip('#4CAF50'),
            enemyShip: this.createPlaceholderShip('#8B4513'),
            motherShip: this.createPlaceholderShip('#AA0000'),
            background: this.createPlaceholderShip('#000066'),
        };

        this.loaded = true;
        return Promise.resolve();
    }
} 