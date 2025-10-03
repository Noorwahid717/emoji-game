import Phaser from 'phaser';

import { GameConfig } from '../config/GameConfig';
import { formatTime } from '../core/time/timeFormatting';

type HudOptions = {
  highScore: number;
  audioMuted: boolean;
  audioEnabled: boolean;
  onToggleAudio: (muted: boolean) => void;
};

export class Hud extends Phaser.GameObjects.Container {
  private readonly scoreText: Phaser.GameObjects.Text;

  private readonly timerText: Phaser.GameObjects.Text;

  private readonly highScoreText: Phaser.GameObjects.Text;

  private readonly audioButton: Phaser.GameObjects.Container;

  private readonly audioIcon: Phaser.GameObjects.Text;

  private readonly audioEnabled: boolean;

  private audioMuted: boolean;

  private readonly onToggleAudio: (muted: boolean) => void;

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

    this.audioMuted = options.audioMuted;
    this.audioEnabled = options.audioEnabled;
    this.onToggleAudio = options.onToggleAudio;

    this.audioButton = scene.add.container(scene.scale.width - 64, 84).setDepth(6);
    const buttonBackground = scene.add.rectangle(0, 0, 60, 60, 0x0f172a, 0.68);
    buttonBackground.setStrokeStyle(3, 0x38bdf8, 0.85);
    buttonBackground.setOrigin(0.5);
    if (this.audioEnabled) {
      buttonBackground.setInteractive({ useHandCursor: true });
    }

    this.audioIcon = scene.add
      .text(0, 0, '', {
        fontFamily: '"Segoe UI Emoji", "Apple Color Emoji", Arial',
        fontSize: '32px',
        color: '#f8fafc',
      })
      .setOrigin(0.5);

    this.audioButton.add([buttonBackground, this.audioIcon]);
    this.audioButton.setSize(60, 60);
    if (this.audioEnabled) {
      buttonBackground
        .on('pointerover', () => {
          scene.tweens.add({ targets: this.audioButton, scale: 1.05, duration: 120 });
        })
        .on('pointerout', () => {
          scene.tweens.add({ targets: this.audioButton, scale: 1, duration: 120 });
        })
        .on('pointerup', () => {
          this.toggleAudio();
        });
    }

    this.updateAudioIcon();
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

  public setAudioMuted(muted: boolean): void {
    this.audioMuted = muted;
    this.updateAudioIcon();
  }

  private toggleAudio(): void {
    if (!this.audioEnabled) {
      return;
    }

    this.audioMuted = !this.audioMuted;
    this.updateAudioIcon();
    this.onToggleAudio(this.audioMuted);
  }

  private updateAudioIcon(): void {
    if (!this.audioEnabled) {
      this.audioIcon.setText('🔇');
      this.audioIcon.setAlpha(0.5);
      return;
    }

    this.audioIcon.setText(this.audioMuted ? '🔇' : '🔊');
    this.audioIcon.setAlpha(this.audioMuted ? 0.7 : 1);
  }
}

export default Hud;
