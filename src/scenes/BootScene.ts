import Phaser from 'phaser';

import simpleAudio from '../core/audio/SimpleAudio';
import { loadHighScore } from '../core/storage/highScoreStorage';

class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  public init(): void {
    const highScore = loadHighScore();
    this.registry.set('highscore', highScore);
  }

  public create(): void {
    const hasAudio = simpleAudio.init();
    this.registry.set('simpleAudio', simpleAudio);
    this.registry.set('hasAudio', hasAudio);

    this.scene.start('Preloader');
  }
}

export default BootScene;
