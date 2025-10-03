import Phaser from 'phaser';

import type { PowerUpSettings } from '../config/GameConfig';
import { onLocaleChange, t } from '../core/locale/Localization';
import { formatTime } from '../core/time/timeFormatting';
import { announceScore, announceTimer } from './accessibility/liveRegions';

type PowerUpType = 'hint' | 'freeze' | 'shuffle';

type PowerUpCallbacks = Record<PowerUpType, () => void>;

type HudOptions = {
  highScore: number;
  audioMuted: boolean;
  audioEnabled: boolean;
  colorBlindMode: boolean;
  level: number;
  modeLabelKey: string;
  timerEnabled: boolean;
  timerWarning: number;
  powerUps: PowerUpSettings;
  powerUpCallbacks: PowerUpCallbacks;
  onToggleAudio: (muted: boolean) => void;
  onToggleColorBlind: (enabled: boolean) => void;
};

interface PowerUpButton {
  container: Phaser.GameObjects.Container;
  icon: Phaser.GameObjects.Text;
  count: Phaser.GameObjects.Text;
  remaining: number;
  type: PowerUpType;
}

export class Hud extends Phaser.GameObjects.Container {
  private readonly scoreText: Phaser.GameObjects.Text;

  private readonly timerText: Phaser.GameObjects.Text;

  private readonly highScoreText: Phaser.GameObjects.Text;

  private readonly levelText: Phaser.GameObjects.Text;

  private readonly streakText: Phaser.GameObjects.Text;

  private readonly movesText: Phaser.GameObjects.Text;

  private readonly modeText: Phaser.GameObjects.Text;

  private readonly statusText: Phaser.GameObjects.Text;

  private readonly audioButton: Phaser.GameObjects.Container;

  private readonly audioIcon: Phaser.GameObjects.Text;

  private readonly colorButton: Phaser.GameObjects.Container;

  private readonly colorIcon: Phaser.GameObjects.Text;

  private readonly powerUpButtons: Record<PowerUpType, PowerUpButton>;

  private readonly audioEnabled: boolean;

  private audioMuted: boolean;

  private colorBlindMode: boolean;

  private readonly onToggleAudio: (muted: boolean) => void;

  private readonly onToggleColorBlind: (enabled: boolean) => void;

  private readonly powerUpCallbacks: PowerUpCallbacks;

  private localeDisposer?: () => void;

  private currentScore = 0;

  private currentHighScore: number;

  private currentTime = 0;

  private currentLevel = 1;

  private currentStreak = 0;

  private currentMoves = 0;

  private currentMultiplier = 1;

  private readonly timerEnabled: boolean;

  private readonly timerWarning: number;

  private readonly modeLabelKey: string;

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
    this.currentLevel = options.level;
    this.timerEnabled = options.timerEnabled;
    this.timerWarning = options.timerWarning;
    this.modeLabelKey = options.modeLabelKey;
    this.powerUpCallbacks = options.powerUpCallbacks;

    this.highScoreText = scene.add.text(24, 16, '', baseStyle).setDepth(5);
    this.scoreText = scene.add.text(24, 76, '', baseStyle).setDepth(5);
    this.levelText = scene.add.text(24, 136, '', baseStyle).setDepth(5);

    this.modeText = scene.add
      .text(scene.scale.width / 2, 24, '', {
        ...baseStyle,
        fontSize: '24px',
      })
      .setOrigin(0.5, 0)
      .setDepth(5);

    this.timerText = scene.add
      .text(scene.scale.width - 24, 16, '', baseStyle)
      .setOrigin(1, 0)
      .setDepth(5);

    this.streakText = scene.add
      .text(scene.scale.width - 24, 76, '', baseStyle)
      .setOrigin(1, 0)
      .setDepth(5);

    this.movesText = scene.add
      .text(scene.scale.width - 24, 136, '', baseStyle)
      .setOrigin(1, 0)
      .setDepth(5);

    this.statusText = scene.add
      .text(scene.scale.width / 2, 96, '', {
        ...baseStyle,
        fontSize: '24px',
        backgroundColor: 'rgba(15,23,42,0.6)',
      })
      .setOrigin(0.5)
      .setDepth(6)
      .setAlpha(0);

    this.audioMuted = options.audioMuted;
    this.audioEnabled = options.audioEnabled;
    this.colorBlindMode = options.colorBlindMode;
    this.onToggleAudio = options.onToggleAudio;
    this.onToggleColorBlind = options.onToggleColorBlind;

    this.audioButton = scene.add.container(scene.scale.width - 64, 196).setDepth(6);
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

    this.colorButton = scene.add.container(scene.scale.width - 140, 196).setDepth(6);
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

    this.powerUpButtons = {
      hint: this.createPowerUpButton('hint', '💡', 'hud.powerups.hint', options.powerUps.hint, 0),
      freeze: this.createPowerUpButton(
        'freeze',
        '🧊',
        'hud.powerups.freeze',
        options.powerUps.freeze,
        1,
      ),
      shuffle: this.createPowerUpButton(
        'shuffle',
        '🔀',
        'hud.powerups.shuffle',
        options.powerUps.shuffle,
        2,
      ),
    };

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

  public updateLevel(level: number): void {
    this.currentLevel = level;
    this.levelText.setText(t('hud.level', { level }));
  }

  public updateTimer(secondsRemaining: number): void {
    if (!this.timerEnabled) {
      this.timerText.setVisible(false);
      return;
    }

    this.timerText.setVisible(true);
    this.currentTime = secondsRemaining;
    const formatted = formatTime(secondsRemaining);
    this.timerText.setText(t('hud.timer', { time: formatted }));

    if (secondsRemaining <= this.timerWarning) {
      this.timerText.setColor('#f97316');
    } else {
      this.timerText.setColor('#ffffff');
    }

    announceTimer(Math.max(0, secondsRemaining));
  }

  public updateMoves(moves: number): void {
    this.currentMoves = moves;
    this.movesText.setText(t('hud.moves', { moves }));
    this.movesText.setVisible(true);
  }

  public updateStreak(streak: number, multiplier: number): void {
    this.currentStreak = streak;
    this.currentMultiplier = multiplier;
    if (streak <= 1) {
      this.streakText.setText(t('hud.streakBase'));
    } else {
      this.streakText.setText(t('hud.streak', { streak, multiplier: multiplier.toFixed(1) }));
    }
  }

  public setAudioMuted(muted: boolean): void {
    this.audioMuted = muted;
    this.updateAudioIcon();
  }

  public setColorBlindMode(enabled: boolean): void {
    this.colorBlindMode = enabled;
    this.updateColorIcon();
  }

  public updatePowerUpCount(type: PowerUpType, remaining: number): void {
    const button = this.powerUpButtons[type];
    if (!button) {
      return;
    }
    button.remaining = remaining;
    button.count.setText(`x${remaining}`);
    button.container.setAlpha(remaining > 0 ? 1 : 0.35);
    button.container.removeAllListeners();
    button.container.disableInteractive();
    if (remaining > 0) {
      button.container.setInteractive({ useHandCursor: true }).once('pointerup', () => {
        this.handlePowerUp(type);
      });
    }
  }

  public setPowerUpDisabled(type: PowerUpType, disabled: boolean): void {
    const button = this.powerUpButtons[type];
    if (!button) {
      return;
    }
    button.container.removeAllListeners();
    if (disabled) {
      button.container.disableInteractive();
      button.container.setAlpha(0.4);
    } else {
      button.container.setAlpha(button.remaining > 0 ? 1 : 0.35);
      if (button.remaining > 0) {
        button.container.setInteractive({ useHandCursor: true }).once('pointerup', () => {
          this.handlePowerUp(type);
        });
      }
    }
  }

  public showStatus(message: string, tint = '#fef08a'): void {
    this.statusText.setText(message);
    this.statusText.setStyle({ color: tint });
    this.statusText.setAlpha(1);
    this.scene.tweens.add({
      targets: this.statusText,
      alpha: 0,
      duration: 1200,
      ease: 'Sine.easeInOut',
      delay: 200,
    });
  }

  private handlePowerUp(type: PowerUpType): void {
    const button = this.powerUpButtons[type];
    if (!button || button.remaining <= 0) {
      return;
    }
    button.remaining -= 1;
    this.updatePowerUpCount(type, button.remaining);
    const callback = this.powerUpCallbacks[type];
    callback();
  }

  private createPowerUpButton(
    type: PowerUpType,
    icon: string,
    labelKey: string,
    initialCount: number,
    index: number,
  ): PowerUpButton {
    const x = this.scene.scale.width - 74;
    const y = 320 + index * 90;

    const container = this.scene.add.container(x, y).setDepth(6);
    const background = this.scene.add.rectangle(0, 0, 92, 72, 0x0f172a, 0.74);
    background.setStrokeStyle(3, 0x38bdf8, 0.85);
    background.setOrigin(0.5);

    const iconText = this.scene.add
      .text(-16, 0, icon, {
        fontFamily: '"Segoe UI Emoji", "Apple Color Emoji", Arial',
        fontSize: '42px',
        color: '#f8fafc',
      })
      .setOrigin(0.5);

    const countText = this.scene.add
      .text(22, 0, `x${initialCount}`, {
        fontFamily: '"Segoe UI", Arial, sans-serif',
        fontSize: '24px',
        color: '#f8fafc',
      })
      .setOrigin(0.5);

    container.add([background, iconText, countText]);
    container.setSize(92, 72);
    container.setAlpha(initialCount > 0 ? 1 : 0.35);
    if (initialCount > 0) {
      container.setInteractive({ useHandCursor: true }).once('pointerup', () => {
        this.handlePowerUp(type);
      });
    }
    container.setData('labelKey', labelKey);

    return {
      container,
      icon: iconText,
      count: countText,
      remaining: initialCount,
      type,
    };
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
    this.levelText.setText(t('hud.level', { level: this.currentLevel }));
    this.modeText.setText(t('hud.mode', { mode: t(this.modeLabelKey) }));
    if (this.timerEnabled) {
      this.timerText.setText(t('hud.timer', { time: formatTime(this.currentTime) }));
    } else {
      this.timerText.setVisible(false);
    }
    this.movesText.setVisible(!this.timerEnabled);
    if (!this.timerEnabled) {
      this.movesText.setText(t('hud.moves', { moves: this.currentMoves }));
    }
    this.updateAudioIcon();
    this.updateColorIcon();
    this.updateStreak(this.currentStreak, this.currentMultiplier);

    (Object.values(this.powerUpButtons) as PowerUpButton[]).forEach((button) => {
      const labelKey = button.container.getData('labelKey') as string;
      button.container.setData('label', t(labelKey));
      this.updatePowerUpCount(button.type, button.remaining);
    });
  }

  public destroy(fromScene?: boolean): void {
    this.localeDisposer?.();
    super.destroy(fromScene);
  }
}

export default Hud;
