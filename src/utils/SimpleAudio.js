/**
 * Simple Audio System
 * Web Audio API based sound generation to avoid CORS issues
 */

export class SimpleAudio {
    constructor() {
        this.audioContext = null;
        this.initialized = false;
        this.sounds = {};
    }

    /**
     * Initialize audio context
     */
    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
            console.log('🎵 Simple Audio System initialized');
            return true;
        } catch (error) {
            console.warn('⚠️ Web Audio API not supported:', error);
            return false;
        }
    }

    /**
     * Create a simple beep sound
     * @param {number} frequency - Frequency in Hz
     * @param {number} duration - Duration in seconds
     * @param {number} volume - Volume (0-1)
     * @returns {Promise} Promise that resolves when sound finishes
     */
    beep(frequency = 440, duration = 0.1, volume = 0.1) {
        if (!this.initialized) return Promise.resolve();

        return new Promise((resolve) => {
            try {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);

                oscillator.frequency.value = frequency;
                oscillator.type = 'sine';

                gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
                gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
                gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration);

                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + duration);

                oscillator.onended = () => resolve();
            } catch (error) {
                console.warn('⚠️ Error playing beep:', error);
                resolve();
            }
        });
    }

    /**
     * Play match sound (happy beep)
     */
    playMatch() {
        return this.beep(660, 0.15, 0.2);
    }

    /**
     * Play countdown sound (warning beep)
     */
    playCountdown() {
        return this.beep(220, 0.3, 0.15);
    }

    /**
     * Play success sound (ascending notes)
     */
    async playSuccess() {
        if (!this.initialized) return;
        
        await this.beep(440, 0.1, 0.1);
        await this.beep(550, 0.1, 0.1); 
        await this.beep(660, 0.2, 0.15);
    }

    /**
     * Play error sound (descending notes)
     */
    async playError() {
        if (!this.initialized) return;
        
        await this.beep(330, 0.1, 0.1);
        await this.beep(220, 0.2, 0.15);
    }

    /**
     * Resume audio context (required for some browsers)
     */
    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            return this.audioContext.resume();
        }
        return Promise.resolve();
    }
}

// Create global instance
export const simpleAudio = new SimpleAudio();

export default simpleAudio;
