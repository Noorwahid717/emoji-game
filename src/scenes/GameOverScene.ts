import Phaser from 'phaser';

import PrimaryButton from '../ui/PrimaryButton';

interface GameOverData {
  won: boolean;
  score: number;
  highScore: number;
  matches: number;
  totalPairs: number;
  timeRemaining: number;
}

class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOver');
  }

  public create(data?: GameOverData): void {
    const payload: GameOverData = data ?? {
      won: false,
      score: 0,
      highScore: 0,
      matches: 0,
      totalPairs: 0,
      timeRemaining: 0,
    };

    this.add.image(this.scale.width / 2, this.scale.height / 2, 'background').setAlpha(0.6);

    const panel = this.add.rectangle(400, 300, 520, 360, 0x0f172a, 0.94);
    panel.setStrokeStyle(4, payload.won ? 0x22c55e : 0xf97316, 0.9);

    const title = payload.won ? 'You cleared the board! 🎉' : 'Time is up! ⏰';
    this.add
      .text(400, 200, title, {
        fontFamily: '"Segoe UI", Arial, sans-serif',
        fontSize: '32px',
        color: '#ffffff',
        align: 'center',
      })
      .setOrigin(0.5);

    const stats = [
      `Score: ${payload.score}`,
      `Pairs found: ${payload.matches}/${payload.totalPairs}`,
    ];

    if (payload.won) {
      stats.push(`Time remaining: ${payload.timeRemaining}s`);
    }

    stats.push(`Best score: ${payload.highScore}`);

    this.add
      .text(400, 280, stats.join('\n'), {
        fontFamily: '"Segoe UI", Arial, sans-serif',
        fontSize: '24px',
        color: '#e2e8f0',
        align: 'center',
        lineSpacing: 12,
      })
      .setOrigin(0.5);

    new PrimaryButton(this, 400, 380, {
      label: 'Play Again',
      onClick: () => {
        this.scene.start('Game');
      },
    });

    new PrimaryButton(this, 400, 460, {
      label: 'Main Menu',
      onClick: () => {
        this.scene.start('Menu');
      },
    });
  }
}

export default GameOverScene;
