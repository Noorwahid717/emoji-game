/**
 * Emoji Match Game - Main Entry Point
 * Based on the Emoji Match game by Tom Miller (https://codepen.io/creativeocean/full/OeKjmp)
 * Restructured and enhanced for better organization
 */

// Wait for DOM to be ready, then initialize game
document.addEventListener('DOMContentLoaded', initGame);

async function initGame() {
    // Update status if available
    const updateStatus = (msg) => {
        console.log(msg);
        if (window.updateStatus) window.updateStatus(msg);
    };

    // Check if Phaser is loaded
    if (typeof Phaser === 'undefined') {
        const error = '❌ Phaser.js not loaded! Make sure it\'s included before main.js';
        updateStatus(error);
        console.error(error);
        return;
    }

    updateStatus('🔄 Loading game modules...');

    try {
        // Import modules after Phaser is available
        const [
            { default: Boot },
            { default: Preloader },
            { default: MainMenu },
            { default: MainGame },
            { GameConfig }
        ] = await Promise.all([
            import('./scenes/Boot.js'),
            import('./scenes/Preloader.js'),
            import('./scenes/MainMenu.js'),
            import('./scenes/Game.js'),
            import('./config/GameConfig.js')
        ]);

        updateStatus('🔄 Initializing game...');

        // Merge game configuration with scenes
        const config = {
            ...GameConfig.phaser,
            scene: [ Boot, Preloader, MainMenu, MainGame ]
        };

        // Initialize the game
        const game = new Phaser.Game(config);
        
        // Store game reference globally for debugging
        window.game = game;
        
        updateStatus('🎮 Emoji Match Game initialized successfully!');
        
    } catch (error) {
        const errorMsg = '❌ Failed to initialize game: ' + error.message;
        updateStatus(errorMsg);
        console.error('Failed to initialize game:', error);
    }
}