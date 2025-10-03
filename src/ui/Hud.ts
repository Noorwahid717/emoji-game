import Phaser from 'phaser';

import { GameConfig } from '../config/GameConfig';
import { formatTime } from '../core/time/timeFormatting';

type HudOptions = {
  highScore: number;
};

export class Hud extends Phaser.GameObjects.Container {
  private readonly scoreText: Phaser.GameObjects.Text;

  private readonly timerText: Phaser.GameObjects.Text;

  private readonly highScoreText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, options: HudOptions) {
    super(scene, 0, 0);
    scene.add.existing(this);

    const baseStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: '"Segoe UI", Arial, sans-serif',
      fontSize: '28px',
      color: '#ffffff',
      stroke: '#0f172a',
      strokeThickness: 4,
    };

    this.highScoreText = scene.add
      .text(24, 16, `Best: ${options.highScore}`, baseStyle)
      .setDepth(5);

    this.scoreText = scene.add.text(24, 56, 'Score: 0', baseStyle).setDepth(5);

    this.timerText = scene.add
      .text(scene.scale.width - 32, 16, formatTime(GameConfig.game.timer.duration), baseStyle)
      .setOrigin(1, 0)
      .setDepth(5);
  }

  public updateScore(score: number): void {
    this.scoreText.setText(`Score: ${score}`);
  }

  public updateHighScore(highScore: number): void {
    this.highScoreText.setText(`Best: ${highScore}`);
  }

  public updateTimer(secondsRemaining: number): void {
    const formatted = formatTime(secondsRemaining);
    this.timerText.setText(formatted);

    if (secondsRemaining <= GameConfig.game.timer.warningTime) {
      this.timerText.setColor('#f97316');
    } else {
      this.timerText.setColor('#ffffff');
    }
  }
}

export default Hud;
