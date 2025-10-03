import Phaser from 'phaser';

import { createGeneratedAssets } from '../assets/createGeneratedAssets';

class PreloaderScene extends Phaser.Scene {
  private statusText?: Phaser.GameObjects.Text;

  constructor() {
    super('Preloader');
  }

  public preload(): void {
    this.statusText = this.add
      .text(this.scale.width / 2, this.scale.height / 2, 'Preparing assets…', {
        fontFamily: '"Segoe UI", Arial, sans-serif',
        fontSize: '32px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    createGeneratedAssets(this);
  }

  public create(): void {
    this.time.delayedCall(150, () => {
      this.scene.start('Menu');
    });
  }
}

export default PreloaderScene;
