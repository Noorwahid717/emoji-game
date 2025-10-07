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
  background: Phaser.GameObjects.Rectangle;
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

  private readonly tooltipContainer: Phaser.GameObjects.Container;

  private readonly tooltipBackground: Phaser.GameObjects.Rectangle;

  private readonly tooltipText: Phaser.GameObjects.Text;

  private tooltipTween?: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, options: HudOptions) {
    super(scene, 0, 0);
    scene.add.existing(this);

    const baseStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: '"Poppins", "Segoe UI", sans-serif',
      fontSize: '26px',
      fontStyle: '600',
      color: '#f8fafc',
      backgroundColor: 'rgba(15,23,42,0.72)',
      padding: { left: 16, right: 16, top: 10, bottom: 10 },
    };

    const leftX = 32;
    const topY = 28;
    const verticalSpacing = 72;
    const rightX = scene.scale.width - 32;

    this.currentHighScore = options.highScore;
    this.currentLevel = options.level;
    this.timerEnabled = options.timerEnabled;
    this.timerWarning = options.timerWarning;
    this.modeLabelKey = options.modeLabelKey;
    this.powerUpCallbacks = options.powerUpCallbacks;

    this.highScoreText = scene.add.text(leftX, topY, '', baseStyle).setDepth(5);
    this.scoreText = scene.add.text(leftX, topY + verticalSpacing, '', baseStyle).setDepth(5);
    this.levelText = scene.add.text(leftX, topY + verticalSpacing * 2, '', baseStyle).setDepth(5);

    [this.highScoreText, this.scoreText, this.levelText].forEach((text) => {
      text.setOrigin(0, 0);
      text.setShadow(0, 4, 'rgba(15, 23, 42, 0.55)', 10, false, true);
    });

    this.modeText = scene.add
      .text(scene.scale.width / 2, topY, '', {
        ...baseStyle,
        fontSize: '22px',
        fontStyle: '600',
        padding: { left: 14, right: 14, top: 6, bottom: 6 },
      })
      .setOrigin(0.5, 0)
      .setDepth(5);
    this.modeText.setShadow(0, 4, 'rgba(15, 23, 42, 0.5)', 10, false, true);

    this.timerText = scene.add.text(rightX, topY, '', baseStyle).setOrigin(1, 0).setDepth(5);
    this.streakText = scene.add
      .text(rightX, topY + verticalSpacing, '', baseStyle)
      .setOrigin(1, 0)
      .setDepth(5);
    this.movesText = scene.add
      .text(rightX, topY + verticalSpacing * 2, '', baseStyle)
      .setOrigin(1, 0)
      .setDepth(5);

    [this.timerText, this.streakText, this.movesText].forEach((text) => {
      text.setShadow(0, 4, 'rgba(15, 23, 42, 0.55)', 10, false, true);
    });

    this.statusText = scene.add
      .text(scene.scale.width / 2, topY + verticalSpacing * 1.1, '', {
        ...baseStyle,
        fontSize: '22px',
        fontStyle: '600',
        backgroundColor: 'rgba(15,23,42,0.58)',
        padding: { left: 16, right: 16, top: 6, bottom: 6 },
      })
      .setOrigin(0.5)
      .setDepth(6)
      .setAlpha(0);
    this.statusText.setShadow(0, 4, 'rgba(15, 23, 42, 0.55)', 12, false, true);

    this.tooltipContainer = scene.add.container(0, 0).setDepth(20).setVisible(false).setAlpha(0);
    this.tooltipBackground = scene.add.rectangle(0, 0, 160, 44, 0x0f172a, 0.92).setOrigin(0.5);
    this.tooltipBackground.setStrokeStyle(2, 0x38bdf8, 0.82);
    this.tooltipText = scene.add
      .text(0, 0, '', {
        fontFamily: '"Poppins", "Segoe UI", sans-serif',
        fontSize: '16px',
        fontStyle: '500',
        color: '#f8fafc',
        align: 'center',
        padding: { left: 6, right: 6, top: 2, bottom: 2 },
      })
      .setOrigin(0.5);
    this.tooltipText.setShadow(0, 3, 'rgba(15, 23, 42, 0.55)', 10, false, true);
    this.tooltipContainer.add([this.tooltipBackground, this.tooltipText]);

    this.audioMuted = options.audioMuted;
    this.audioEnabled = options.audioEnabled;
    this.colorBlindMode = options.colorBlindMode;
    this.onToggleAudio = options.onToggleAudio;
    this.onToggleColorBlind = options.onToggleColorBlind;

    const controlY = topY + verticalSpacing * 2 + 56;

    this.audioButton = scene.add.container(scene.scale.width - 76, controlY).setDepth(6);
    const audioBackground = scene.add.rectangle(0, 0, 64, 64, 0x0f172a, 0.72);
    audioBackground.setStrokeStyle(3, 0x38bdf8, 0.85);
    audioBackground.setOrigin(0.5);
    audioBackground.setInteractive({ useHandCursor: this.audioEnabled });
    audioBackground.on('pointerover', () => {
      scene.tweens.add({
        targets: this.audioButton,
        scale: 1.08,
        duration: 140,
        ease: 'Sine.easeOut',
      });
    });
    audioBackground.on('pointerout', () => {
      scene.tweens.add({
        targets: this.audioButton,
        scale: 1,
        duration: 140,
        ease: 'Sine.easeInOut',
      });
      this.hideTooltip();
    });
    audioBackground.on('pointerup', () => {
      if (this.audioEnabled) {
        this.toggleAudio();
      }
    });

    this.audioIcon = scene.add
      .text(0, 0, '', {
        fontFamily: '"Segoe UI Emoji", "Apple Color Emoji", Arial',
        fontSize: '30px',
        color: '#f8fafc',
      })
      .setOrigin(0.5);
    this.audioIcon.setShadow(0, 3, 'rgba(15, 23, 42, 0.5)', 8, false, true);

    this.audioButton.add([audioBackground, this.audioIcon]);
    this.audioButton.setSize(64, 64);
    this.attachTooltip(audioBackground, this.audioButton, () => {
      const label = this.audioButton.getData('label') as string | undefined;
      return label ?? t('hud.toggleAudio');
    });

    this.colorButton = scene.add.container(scene.scale.width - 156, controlY).setDepth(6);
    const colorBackground = scene.add.rectangle(0, 0, 64, 64, 0x0f172a, 0.72);
    colorBackground.setStrokeStyle(3, 0x10b981, 0.85);
    colorBackground.setOrigin(0.5);
    colorBackground.setInteractive({ useHandCursor: true });
    colorBackground.on('pointerover', () => {
      scene.tweens.add({
        targets: this.colorButton,
        scale: 1.08,
        duration: 140,
        ease: 'Sine.easeOut',
      });
    });
    colorBackground.on('pointerout', () => {
      scene.tweens.add({
        targets: this.colorButton,
        scale: 1,
        duration: 140,
        ease: 'Sine.easeInOut',
      });
      this.hideTooltip();
    });
    colorBackground.on('pointerup', () => {
      this.toggleColorBlind();
    });

    this.colorIcon = scene.add
      .text(0, 0, '', {
        fontFamily: '"Segoe UI Emoji", "Apple Color Emoji", Arial',
        fontSize: '30px',
        color: '#f8fafc',
      })
      .setOrigin(0.5);
    this.colorIcon.setShadow(0, 3, 'rgba(15, 23, 42, 0.5)', 8, false, true);

    this.colorButton.add([colorBackground, this.colorIcon]);
    this.colorButton.setSize(64, 64);
    this.attachTooltip(colorBackground, this.colorButton, () => {
      const label = this.colorButton.getData('label') as string | undefined;
      return label ?? t('hud.toggleColorBlind');
    });

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
    const disabled = (button.container.getData('disabled') as boolean) ?? false;
    const alpha = disabled ? 0.4 : remaining > 0 ? 1 : 0.35;
    button.container.setAlpha(alpha);
    if (button.background.input) {
      button.background.input.cursor = !disabled && remaining > 0 ? 'pointer' : 'default';
    }
  }

  public setPowerUpDisabled(type: PowerUpType, disabled: boolean): void {
    const button = this.powerUpButtons[type];
    if (!button) {
      return;
    }
    button.container.setData('disabled', disabled);
    const alpha = disabled ? 0.4 : button.remaining > 0 ? 1 : 0.35;
    button.container.setAlpha(alpha);
    if (button.background.input) {
      button.background.input.cursor = !disabled && button.remaining > 0 ? 'pointer' : 'default';
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
    if (!button || button.remaining <= 0 || button.container.getData('disabled')) {
      return;
    }
    button.remaining -= 1;
    this.scene.tweens.add({
      targets: button.container,
      scale: { from: 1.12, to: 1 },
      duration: 220,
      ease: 'Back.easeOut',
    });
    this.hideTooltip();
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
    const x = this.scene.scale.width - 72;
    const y = 332 + index * 96;

    const container = this.scene.add.container(x, y).setDepth(6);
    const background = this.scene.add.rectangle(0, 0, 96, 76, 0x0f172a, 0.74);
    background.setStrokeStyle(3, 0x38bdf8, 0.85);
    background.setOrigin(0.5);

    const iconText = this.scene.add
      .text(-18, 0, icon, {
        fontFamily: '"Segoe UI Emoji", "Apple Color Emoji", Arial',
        fontSize: '36px',
        color: '#f8fafc',
      })
      .setOrigin(0.5);
    iconText.setShadow(0, 3, 'rgba(15, 23, 42, 0.5)', 8, false, true);

    const countText = this.scene.add
      .text(26, 0, `x${initialCount}`, {
        fontFamily: '"Poppins", "Segoe UI", sans-serif',
        fontSize: '20px',
        fontStyle: '600',
        color: '#f8fafc',
      })
      .setOrigin(0.5);
    countText.setShadow(0, 3, 'rgba(15, 23, 42, 0.5)', 8, false, true);

    container.add([background, iconText, countText]);
    container.setSize(96, 76);
    container.setAlpha(initialCount > 0 ? 1 : 0.35);
    container.setData('labelKey', labelKey);
    container.setData('label', t(labelKey));
    container.setData('disabled', false);

    const powerUpButton: PowerUpButton = {
      container,
      background,
      icon: iconText,
      count: countText,
      remaining: initialCount,
      type,
    };

    background.setInteractive({ useHandCursor: initialCount > 0 });
    background.on('pointerover', () => {
      this.scene.tweens.add({
        targets: container,
        scale: 1.08,
        duration: 140,
        ease: 'Sine.easeOut',
      });
    });
    background.on('pointerout', () => {
      this.scene.tweens.add({
        targets: container,
        scale: 1,
        duration: 140,
        ease: 'Sine.easeInOut',
      });
      this.hideTooltip();
    });
    background.on('pointerup', () => {
      if (powerUpButton.remaining > 0 && !container.getData('disabled')) {
        this.handlePowerUp(type);
      }
    });

    this.attachTooltip(background, container, () => t(labelKey));

    return powerUpButton;
  }

  private attachTooltip(
    target: Phaser.GameObjects.GameObject,
    anchor: Phaser.GameObjects.Components.Transform,
    getLabel: () => string,
    offset: { x?: number; y?: number } = {},
  ): void {
    const offsetX = offset.x ?? 0;
    const offsetY = offset.y ?? -58;
    target.on('pointerover', () => {
      const label = getLabel();
      if (!label) {
        return;
      }
      this.showTooltip(anchor.x + offsetX, anchor.y + offsetY, label);
    });
    target.on('pointerout', () => {
      this.hideTooltip();
    });
    target.on('pointerdown', () => {
      this.hideTooltip();
    });
  }

  private showTooltip(x: number, y: number, text: string): void {
    if (!text.trim()) {
      return;
    }
    this.tooltipText.setText(text);
    const targetWidth = Math.max(160, this.tooltipText.width + 32);
    this.tooltipBackground.setDisplaySize(targetWidth, 44);
    this.tooltipContainer.setPosition(x, y);
    const wasVisible = this.tooltipContainer.visible;
    this.tooltipContainer.setVisible(true);
    this.tooltipTween?.stop();
    if (!wasVisible) {
      this.tooltipContainer.setAlpha(0);
    }
    this.tooltipTween = this.scene.tweens.add({
      targets: this.tooltipContainer,
      alpha: 1,
      duration: 160,
      ease: 'Sine.easeOut',
    });
  }

  private hideTooltip(): void {
    if (!this.tooltipContainer.visible) {
      return;
    }
    this.tooltipTween?.stop();
    this.tooltipTween = this.scene.tweens.add({
      targets: this.tooltipContainer,
      alpha: 0,
      duration: 140,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.tooltipContainer.setVisible(false);
      },
    });
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
    this.hideTooltip();
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
