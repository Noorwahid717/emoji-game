import Phaser from 'phaser';

import { GameConfig } from '../config/GameConfig';
import { t, onLocaleChange } from '../core/locale/Localization';
import { formatTime } from '../core/time/timeFormatting';
import { announceScore, announceTimer } from './accessibility/liveRegions';

type HudOptions = {
  highScore: number;
  audioMuted: boolean;
  audioEnabled: boolean;
  colorBlindMode: boolean;
  onToggleAudio: (muted: boolean) => void;
  onToggleColorBlind: (enabled: boolean) => void;
};

export class Hud extends Phaser.GameObjects.Container {
  private readonly scoreText: Phaser.GameObjects.Text;

  private readonly timerText: Phaser.GameObjects.Text;

  private readonly highScoreText: Phaser.GameObjects.Text;

  private readonly audioButton: Phaser.GameObjects.Container;

  private readonly audioIcon: Phaser.GameObjects.Text;

  private readonly colorButton: Phaser.GameObjects.Container;

  private readonly colorIcon: Phaser.GameObjects.Text;

  private readonly audioEnabled: boolean;

  private audioMuted: boolean;

  private colorBlindMode: boolean;

  private readonly onToggleAudio: (muted: boolean) => void;

  private readonly onToggleColorBlind: (enabled: boolean) => void;

  private localeDisposer?: () => void;

  private currentScore = 0;

  private currentHighScore: number;

  private currentTime: number;

  constructor(scene: Phaser.Scene, options: HudOptions) {
    super(scene, 0, 0);
    scene.add.existing(this);

    const baseStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: '"Segoe UI", Arial, sans-serif',
      fontSize: '28px',
      color: '#f8fafc',
      backgroundColor: 'rgba(15,23,42,0.78)',
      padding: { left: 12, right: 12, top: 8, bottom: 8 },
    };

    this.currentHighScore = options.highScore;
    this.currentTime = GameConfig.game.timer.duration;

    this.highScoreText = scene.add.text(24, 16, '', baseStyle).setDepth(5);

    this.scoreText = scene.add.text(24, 72, '', baseStyle).setDepth(5);

    this.timerText = scene.add
      .text(scene.scale.width - 24, 16, '', baseStyle)
      .setOrigin(1, 0)
      .setDepth(5);

    this.audioMuted = options.audioMuted;
    this.audioEnabled = options.audioEnabled;
    this.colorBlindMode = options.colorBlindMode;
    this.onToggleAudio = options.onToggleAudio;
    this.onToggleColorBlind = options.onToggleColorBlind;

    this.audioButton = scene.add.container(scene.scale.width - 64, 116).setDepth(6);
    const audioBackground = scene.add.rectangle(0, 0, 60, 60, 0x0f172a, 0.68);
    audioBackground.setStrokeStyle(3, 0x38bdf8, 0.85);
    audioBackground.setOrigin(0.5);
    if (this.audioEnabled) {
      audioBackground.setInteractive({ useHandCursor: true });
    }

    this.audioIcon = scene.add
      .text(0, 0, '', {
        fontFamily: '"Segoe UI Emoji", "Apple Color Emoji", Arial',
        fontSize: '32px',
        color: '#f8fafc',
      })
      .setOrigin(0.5);

    this.audioButton.add([audioBackground, this.audioIcon]);
    this.audioButton.setSize(60, 60);
    if (this.audioEnabled) {
      audioBackground
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

    this.colorButton = scene.add.container(scene.scale.width - 140, 116).setDepth(6);
    const colorBackground = scene.add.rectangle(0, 0, 60, 60, 0x0f172a, 0.68);
    colorBackground.setStrokeStyle(3, 0x10b981, 0.85);
    colorBackground.setOrigin(0.5);
    colorBackground
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        scene.tweens.add({ targets: this.colorButton, scale: 1.05, duration: 120 });
      })
      .on('pointerout', () => {
        scene.tweens.add({ targets: this.colorButton, scale: 1, duration: 120 });
      })
      .on('pointerup', () => {
        this.toggleColorBlind();
      });

    this.colorIcon = scene.add
      .text(0, 0, '', {
        fontFamily: '"Segoe UI Emoji", "Apple Color Emoji", Arial',
        fontSize: '32px',
        color: '#f8fafc',
      })
      .setOrigin(0.5);

    this.colorButton.add([colorBackground, this.colorIcon]);
    this.colorButton.setSize(60, 60);

    this.refreshLabels();

    this.localeDisposer = onLocaleChange(() => {
      this.refreshLabels();
    });
  }

  public updateScore(score: number): void {
    this.currentScore = score;
    this.scoreText.setText(t('hud.score', { score }));
    announceScore(score);
  }

  public updateHighScore(highScore: number): void {
    this.currentHighScore = highScore;
    this.highScoreText.setText(t('hud.highScore', { score: highScore }));
  }

  public updateTimer(secondsRemaining: number): void {
    this.currentTime = secondsRemaining;
    const formatted = formatTime(secondsRemaining);
    this.timerText.setText(t('hud.timer', { time: formatted }));

    if (secondsRemaining <= GameConfig.game.timer.warningTime) {
      this.timerText.setColor('#f97316');
    } else {
      this.timerText.setColor('#ffffff');
    }

    announceTimer(Math.max(0, secondsRemaining));
  }

  public setAudioMuted(muted: boolean): void {
    this.audioMuted = muted;
    this.updateAudioIcon();
  }

  public setColorBlindMode(enabled: boolean): void {
    this.colorBlindMode = enabled;
    this.updateColorIcon();
  }

  private toggleAudio(): void {
    if (!this.audioEnabled) {
      return;
    }

    this.audioMuted = !this.audioMuted;
    this.updateAudioIcon();
    this.onToggleAudio(this.audioMuted);
  }

  private toggleColorBlind(): void {
    this.colorBlindMode = !this.colorBlindMode;
    this.updateColorIcon();
    this.onToggleColorBlind(this.colorBlindMode);
  }

  private updateAudioIcon(): void {
    if (!this.audioEnabled) {
      this.audioIcon.setText('🔇');
      this.audioIcon.setAlpha(0.5);
      this.audioButton.setData('label', t('hud.audioOff'));
      return;
    }

    this.audioIcon.setText(this.audioMuted ? '🔇' : '🔊');
    this.audioIcon.setAlpha(this.audioMuted ? 0.7 : 1);
    const label = this.audioMuted ? t('hud.audioOff') : t('hud.audioOn');
    this.audioButton.setData('label', label);
  }

  private updateColorIcon(): void {
    this.colorIcon.setText(this.colorBlindMode ? '👓' : '🎨');
    this.colorIcon.setAlpha(this.colorBlindMode ? 1 : 0.9);
    const label = this.colorBlindMode ? t('hud.colorBlindOn') : t('hud.colorBlindOff');
    this.colorButton.setData('label', label);
  }

  private refreshLabels(): void {
    this.highScoreText.setText(t('hud.highScore', { score: this.currentHighScore }));
    this.scoreText.setText(t('hud.score', { score: this.currentScore }));
    this.timerText.setText(t('hud.timer', { time: formatTime(this.currentTime) }));
    this.updateAudioIcon();
    this.updateColorIcon();
  }

  public destroy(fromScene?: boolean): void {
    this.localeDisposer?.();
    super.destroy(fromScene);
  }
}

export default Hud;
