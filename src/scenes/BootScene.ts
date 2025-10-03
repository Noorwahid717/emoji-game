import Phaser from 'phaser';

import simpleAudio from '../core/audio/SimpleAudio';
import { loadHighScore } from '../core/storage/highScoreStorage';
import { loadAudioPreference } from '../core/storage/preferencesStorage';

class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  public init(): void {
    const highScore = loadHighScore();
    this.registry.set('highscore', highScore);
    const audioMuted = loadAudioPreference();
    this.registry.set('audioMuted', audioMuted);
  }

  public create(): void {
    const hasAudio = simpleAudio.init();
    this.registry.set('simpleAudio', simpleAudio);
    this.registry.set('hasAudio', hasAudio);
    simpleAudio.setMuted((this.registry.get('audioMuted') as boolean) ?? false);

    this.scene.start('Preloader');
  }
}

export default BootScene;
