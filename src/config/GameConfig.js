/**
 * Game Configuration
 * Central configuration file for the Emoji Match Game
 */

export const GameConfig = {
    // Phaser Game Configuration
    phaser: {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        backgroundColor: '#008eb0',
        parent: 'phaser-example',
        physics: {
            default: 'arcade',
            arcade: {
                debug: false
            }
        }
    },
    
    // Game Settings
    game: {
        gridSize: {
            width: 4,
            height: 4
        },
        cellSize: {
            width: 90,
            height: 90
        },
        gridPosition: {
            x: 280,
            y: 200
        },
        timer: {
            duration: 60, // seconds
            warningTime: 10 // seconds
        },
        scoring: {
            matchPoints: 100,
            timeBonus: 10,
            perfectMatchBonus: 500
        }
    },
    
    // Asset URLs
    assets: {
        baseURL: 'https://cdn.phaserfiles.com/v385',
        imagePath: 'assets/games/emoji-match/',
        soundPath: 'assets/games/emoji-match/sounds/'
    },
    
    // Colors
    colors: {
        selection1: 0xf8960e,
        selection2: 0x00ff00,
        background: '#008eb0',
        text: '#ffffff',
        textShadow: '#000000'
    },
    
    // Audio Settings
    audio: {
        musicVolume: 0.7,
        sfxVolume: 0.8
    }
};

export default GameConfig;
