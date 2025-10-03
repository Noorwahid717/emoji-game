import Phaser from 'phaser';

import { GameConfig } from '../config/GameConfig';
import PrimaryButton from '../ui/PrimaryButton';

class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  public create(): void {
    this.add.image(400, 300, 'background');

    const logo = this.add.image(this.scale.width / 2, -160, 'logo');
    this.tweens.add({ targets: logo, y: 200, ease: 'Back.easeOut', duration: 900 });

    const highScore = this.registry.get('highscore') as number;
    const statsText = this.add
      .text(this.scale.width / 2, 330, `Best score: ${highScore}`)
      .setOrigin(0.5)
      .setStyle({
        fontFamily: '"Segoe UI", Arial, sans-serif',
        fontSize: '24px',
        color: '#ffffff',
        stroke: '#0f172a',
        strokeThickness: 4,
      });

    new PrimaryButton(this, this.scale.width / 2, 420, {
      label: 'Start Game',
      onClick: () => {
        this.scene.start('Game', { grid: GameConfig.game.gridSize });
      },
    });

    new PrimaryButton(this, this.scale.width / 2, 510, {
      label: 'How to Play',
      onClick: () => {
        this.showInstructions();
      },
    });

    statsText.setAlpha(0);
    this.tweens.add({ targets: statsText, alpha: 1, duration: 800, delay: 300 });
  }

  private showInstructions(): void {
    const instructions =
      'Tap two cards to flip them. Match all pairs before the timer ends to win!';

    const modal = this.add.rectangle(400, 300, 640, 240, 0x0f172a, 0.92);
    modal.setStrokeStyle(4, 0x38bdf8, 0.9);

    const text = this.add
      .text(400, 300, instructions, {
        fontFamily: '"Segoe UI", Arial, sans-serif',
        fontSize: '24px',
        color: '#e2e8f0',
        align: 'center',
        wordWrap: { width: 560 },
      })
      .setOrigin(0.5);

    this.time.delayedCall(3200, () => {
      modal.destroy();
      text.destroy();
    });
  }
}

export default MenuScene;
