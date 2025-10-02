/**
 * Game Utilities
 * Helper functions for the Emoji Match Game
 */

export class GameUtils {
    /**
     * Shuffle an array using Fisher-Yates algorithm
     * @param {Array} array - Array to shuffle
     * @returns {Array} Shuffled array
     */
    static shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * Generate pairs of numbers for matching game
     * @param {number} pairCount - Number of unique pairs needed
     * @returns {Array} Array of paired numbers
     */
    static generateMatchingPairs(pairCount) {
        const pairs = [];
        for (let i = 0; i < pairCount; i++) {
            pairs.push(i, i); // Add each number twice
        }
        return this.shuffleArray(pairs);
    }

    /**
     * Format time in MM:SS format
     * @param {number} seconds - Time in seconds
     * @returns {string} Formatted time string
     */
    static formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    /**
     * Calculate score with time bonus
     * @param {number} baseScore - Base score for the match
     * @param {number} timeRemaining - Time remaining in seconds
     * @param {number} timeBonus - Bonus points per second
     * @returns {number} Total score including bonus
     */
    static calculateScoreWithTimeBonus(baseScore, timeRemaining, timeBonus) {
        return baseScore + (timeRemaining * timeBonus);
    }

    /**
     * Save high score to local storage
     * @param {number} score - Score to save
     */
    static saveHighScore(score) {
        const currentHigh = this.getHighScore();
        if (score > currentHigh) {
            localStorage.setItem('emojiMatchHighScore', score.toString());
            return true; // New high score
        }
        return false; // Not a new high score
    }

    /**
     * Get high score from local storage
     * @returns {number} High score
     */
    static getHighScore() {
        const stored = localStorage.getItem('emojiMatchHighScore');
        return stored ? parseInt(stored, 10) : 0;
    }

    /**
     * Create a tween for emoji selection animation
     * @param {Phaser.Scene} scene - Phaser scene instance
     * @param {Phaser.GameObjects.GameObject} target - Target object to animate
     * @param {number} scale - Target scale
     * @param {number} duration - Animation duration
     * @returns {Phaser.Tweens.Tween} The created tween
     */
    static createSelectionTween(scene, target, scale = 1.1, duration = 200) {
        return scene.tweens.add({
            targets: target,
            scaleX: scale,
            scaleY: scale,
            duration: duration,
            ease: 'Power2',
            yoyo: true
        });
    }

    /**
     * Create a pulse animation for UI elements
     * @param {Phaser.Scene} scene - Phaser scene instance
     * @param {Phaser.GameObjects.GameObject} target - Target object to animate
     * @param {Object} options - Animation options
     * @returns {Phaser.Tweens.Tween} The created tween
     */
    static createPulseAnimation(scene, target, options = {}) {
        const defaults = {
            scale: 1.05,
            duration: 1000,
            repeat: -1,
            yoyo: true,
            ease: 'Sine.easeInOut'
        };
        const config = { ...defaults, ...options };

        return scene.tweens.add({
            targets: target,
            scaleX: config.scale,
            scaleY: config.scale,
            duration: config.duration,
            repeat: config.repeat,
            yoyo: config.yoyo,
            ease: config.ease
        });
    }

    /**
     * Create text with consistent styling
     * @param {Phaser.Scene} scene - Phaser scene instance
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} text - Text content
     * @param {Object} customStyle - Custom style overrides
     * @returns {Phaser.GameObjects.Text} Created text object
     */
    static createStyledText(scene, x, y, text, customStyle = {}) {
        const defaultStyle = {
            fontFamily: 'Arial',
            fontSize: 32,
            color: '#ffffff',
            fontStyle: 'bold',
            padding: 8,
            shadow: {
                color: '#000000',
                fill: true,
                offsetX: 2,
                offsetY: 2,
                blur: 4
            }
        };

        const style = { ...defaultStyle, ...customStyle };
        return scene.add.text(x, y, text, style);
    }

    /**
     * Check if device is mobile
     * @returns {boolean} True if mobile device
     */
    static isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    /**
     * Get optimal font size based on screen size
     * @param {number} baseSize - Base font size
     * @returns {number} Optimal font size
     */
    static getOptimalFontSize(baseSize) {
        const screenWidth = window.innerWidth;
        if (screenWidth < 480) {
            return Math.floor(baseSize * 0.7);
        } else if (screenWidth < 768) {
            return Math.floor(baseSize * 0.8);
        }
        return baseSize;
    }

    /**
     * Clamp a value between min and max
     * @param {number} value - Value to clamp
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Clamped value
     */
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    /**
     * Linear interpolation between two values
     * @param {number} start - Start value
     * @param {number} end - End value
     * @param {number} t - Interpolation factor (0-1)
     * @returns {number} Interpolated value
     */
    static lerp(start, end, t) {
        return start + (end - start) * this.clamp(t, 0, 1);
    }
}

export default GameUtils;
