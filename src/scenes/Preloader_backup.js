export default class Preloader extends Phaser.Scene
{
    constructor ()
    {
        super('Preloader');

        this.loadText;
    }

    preload ()
    {
        this.loadText = this.add.text(400, 360, 'Creating Assets...', { fontFamily: 'Arial', fontSize: 64, color: '#e3f2ed' });

        this.loadText.setOrigin(0.5);
        this.loadText.setStroke('#203c5b', 6);
        this.loadText.setShadow(2, 2, '#2d2d2d', 4, true, false);

        // Create assets directly instead of loading from CDN
        this.createGameAssets();
        
        // Skip audio loading for now to avoid CORS issues
        // We'll add placeholder audio or use Web Audio API later
        console.log('🔇 Audio loading skipped to avoid CORS issues');
        
        // Optional: Try to load audio with different approach
        // this.loadLocalAudio();
    }
    
    /**
     * Create game assets directly using canvas
     */
    createGameAssets() {
        console.log('🎨 Creating fallback assets...');
        
        // Create background
        this.createBackground();
        
        // Create logo  
        this.createLogo();
        
        // Create emoji atlas
        this.createEmojiAtlas();
        
        console.log('✅ All assets created successfully');
    }
    
    /**
     * Create gradient background
     */
    createBackground() {
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');
        
        // Create gradient background
        const gradient = ctx.createLinearGradient(0, 0, 800, 600);
        gradient.addColorStop(0, '#4facfe');
        gradient.addColorStop(1, '#00f2fe');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 800, 600);
        
        // Add some pattern
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        for(let i = 0; i < 50; i++) {
            const x = Math.random() * 800;
            const y = Math.random() * 600;
            const r = Math.random() * 20 + 5;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }
        
        this.textures.addCanvas('background', canvas);
    }
    
    /**
     * Create game logo
     */
    createLogo() {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 150;
        const ctx = canvas.getContext('2d');
        
        // Logo background
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.roundRect(10, 10, 380, 130, 20);
        ctx.fill();
        
        // Border
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 3;
        ctx.roundRect(10, 10, 380, 130, 20);
        ctx.stroke();
        
        // Title
        ctx.fillStyle = '#333333';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🎮 EMOJI MATCH', 200, 60);
        
        ctx.font = '18px Arial';
        ctx.fillText('Find the matching pairs!', 200, 90);
        ctx.fillText('Click to start playing', 200, 115);
        
        this.textures.addCanvas('logo', canvas);
    }
    
    /**
     * Create emoji atlas with text-based emojis
     */
    createEmojiAtlas() {
        // Emoji array - using Unicode emojis
        const emojis = ['😀', '😎', '🎮', '🎯', '⭐', '🎨', '🎪', '🎭'];
        
        const cellSize = 64;
        const canvas = document.createElement('canvas');
        canvas.width = cellSize * emojis.length;
        canvas.height = cellSize;
        const ctx = canvas.getContext('2d');
        
        ctx.font = '40px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const frames = {};
        
        // Draw each emoji
        emojis.forEach((emoji, index) => {
            const x = index * cellSize;
            const centerX = x + cellSize / 2;
            const centerY = cellSize / 2;
            
            // Background circle
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(centerX, centerY, 28, 0, Math.PI * 2);
            ctx.fill();
            
            // Border
            ctx.strokeStyle = '#cccccc';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Emoji
            ctx.fillText(emoji, centerX, centerY);
            
            // Create frame data
            frames[index.toString()] = {
                frame: { x: x, y: 0, w: cellSize, h: cellSize },
                rotated: false,
                trimmed: false,
                spriteSourceSize: { x: 0, y: 0, w: cellSize, h: cellSize },
                sourceSize: { w: cellSize, h: cellSize }
            };
        });
        
        // Add texture to Phaser
        this.textures.addCanvas('emojis', canvas);
        
        // Add atlas data to cache
        const atlasData = {
            frames: frames,
            meta: {
                image: 'emojis',
                format: 'RGBA8888',
                size: { w: canvas.width, h: canvas.height },
                scale: '1'
            }
        };
        
        this.cache.json.add('emojis', atlasData);
        
        console.log('✅ Created emoji atlas with', Object.keys(frames).length, 'frames');
    }
    }

    
    /**
     * Load audio with fallback for CORS issues
     */
    loadLocalAudio() {
        // Create placeholder sounds using Web Audio API
        this.createPlaceholderSounds();
    }
    
    /**
     * Create simple placeholder sounds
     */
    async createPlaceholderSounds() {
        // Import and initialize SimpleAudio system
        try {
            const { simpleAudio } = await import('../utils/SimpleAudio.js');
            const success = simpleAudio.init();
            
            // Store audio system in registry for other scenes
            this.registry.set('simpleAudio', simpleAudio);
            this.registry.set('hasAudio', success);
            
            if (success) {
                console.log('🎵 Simple audio system ready');
            } else {
                console.log('🔇 Audio system not available');
            }
        } catch (error) {
            console.warn('⚠️ Could not load audio system:', error);
            this.registry.set('hasAudio', false);
        }
    }

    create ()
    {
        // Initialize placeholder audio
        this.createPlaceholderSounds();
        
        if (this.sound.locked)
        {
            this.loadText.setText('Click to Start');

            this.input.once('pointerdown', () => {
                // Resume audio context on user interaction  
                const simpleAudio = this.registry.get('simpleAudio');
                if (simpleAudio) {
                    simpleAudio.resume();
                }
                this.scene.start('MainMenu');
            });
        }
        else
        {
            this.scene.start('MainMenu');
        }
    }
}