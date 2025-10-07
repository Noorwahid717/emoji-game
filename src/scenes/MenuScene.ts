import Phaser from 'phaser';

import { GameConfig, type GameMode } from '../config/GameConfig';
import { cycleLocale, getLocale, getLocaleName, t } from '../core/locale/Localization';
import { getMissionStates } from '../core/missions/missions';
import { loadHighScore } from '../core/storage/highScoreStorage';
import { persistLocalePreference, persistModePreference } from '../core/storage/preferencesStorage';
import simpleAudio from '../core/audio/SimpleAudio';
import PrimaryButton from '../ui/PrimaryButton';

class MenuScene extends Phaser.Scene {
  private audioUnlockRegistered = false;
  constructor() {
    super('Menu');
  }

  public create(): void {
    this.add.image(400, 300, 'background');

    this.installAudioUnlock();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.audioUnlockRegistered = false;
    });

    const logoImage = this.add.image(this.scale.width / 2, -160, 'logo');
    this.tweens.add({ targets: logoImage, y: 120, ease: 'Back.easeOut', duration: 900 });

    const title = this.add
      .text(this.scale.width / 2, 190, t('app.title'), {
        fontFamily: '"Poppins", "Segoe UI", sans-serif',
        fontSize: '48px',
        fontStyle: '700',
        color: '#f8fafc',
        align: 'center',
      })
      .setOrigin(0.5);
    title.setShadow(0, 10, 'rgba(15, 23, 42, 0.55)', 18, false, true);

    const subtitle = this.add
      .text(this.scale.width / 2, 246, t('app.description'), {
        fontFamily: '"Poppins", "Segoe UI", sans-serif',
        fontSize: '20px',
        fontStyle: '500',
        color: '#e2e8f0',
        align: 'center',
        padding: { left: 16, right: 16, top: 8, bottom: 8 },
        backgroundColor: 'rgba(15,23,42,0.55)',
      })
      .setOrigin(0.5);
    subtitle.setShadow(0, 6, 'rgba(15, 23, 42, 0.45)', 12, false, true);

    this.tweens.add({
      targets: [title, subtitle],
      alpha: { from: 0, to: 1 },
      duration: 600,
      delay: 200,
    });

    const highScores = (this.registry.get('highscores') as Record<GameMode, number>) ?? {
      classic: 0,
      zen: 0,
      hard: 0,
      daily: 0,
    };
    const preferredMode = (this.registry.get('mode') as GameMode) ?? 'classic';
    const dailySeed = (this.registry.get('dailySeed') as string) ?? '';
    const dailyHighScore = loadHighScore('daily', dailySeed);
    const missionStates = getMissionStates();

    const highScoreText = this.add
      .text(this.scale.width / 2, 308, t('menu.bestScore', { score: highScores.classic }), {
        fontFamily: '"Poppins", "Segoe UI", sans-serif',
        fontSize: '24px',
        fontStyle: '600',
        color: '#f8fafc',
        padding: { left: 16, right: 16, top: 10, bottom: 10 },
        backgroundColor: 'rgba(15,23,42,0.65)',
      })
      .setOrigin(0.5);
    highScoreText.setShadow(0, 8, 'rgba(15, 23, 42, 0.55)', 14, false, true);

    const missionPanelHeight = 84 + missionStates.length * 32;
    const missionPanel = this.add
      .rectangle(this.scale.width / 2, 420, 540, missionPanelHeight, 0x0f172a, 0.42)
      .setStrokeStyle(2, 0x38bdf8, 0.4)
      .setOrigin(0.5);

    const missionHeader = this.add
      .text(
        this.scale.width / 2,
        missionPanel.y - missionPanelHeight / 2 + 36,
        t('missions.header'),
        {
          fontFamily: '"Poppins", "Segoe UI", sans-serif',
          fontSize: '22px',
          fontStyle: '600',
          color: '#f8fafc',
          align: 'center',
        },
      )
      .setOrigin(0.5);
    missionHeader.setShadow(0, 6, 'rgba(15, 23, 42, 0.45)', 10, false, true);

    missionStates.forEach((mission, index) => {
      const status = `${mission.progress}/${mission.goal}`;
      const line = this.add.text(
        this.scale.width / 2,
        missionHeader.y + 36 + index * 32,
        `${t(mission.descriptionKey)} — ${status}`,
        {
          fontFamily: '"Poppins", "Segoe UI", sans-serif',
          fontSize: '18px',
          fontStyle: '500',
          color: mission.completed ? '#22c55e' : '#e2e8f0',
          align: 'center',
        },
      );
      line.setOrigin(0.5);
      line.setShadow(0, 4, 'rgba(15, 23, 42, 0.5)', 10, false, true);
    });

    const howToButton = new PrimaryButton(this, this.scale.width / 2 - 170, 468, {
      label: t('menu.howToPlay'),
      onClick: () => {
        this.showInstructions();
      },
      variant: 'secondary',
    });

    const locale = getLocale();
    const languageButton = new PrimaryButton(this, this.scale.width / 2 + 170, 468, {
      label: t('menu.language', { language: getLocaleName(locale) }),
      onClick: () => {
        this.changeLanguage();
      },
      variant: 'secondary',
    });

    const modeList = Object.values(GameConfig.game.modes);
    const columns = Math.min(2, modeList.length);
    const columnOffsets = columns === 1 ? [0] : [-160, 160];
    const rowSpacing = 92;
    const baseModeY = 560;
    const descriptionOffset = 30;

    modeList.forEach((mode, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const x = this.scale.width / 2 + columnOffsets[column];
      const y = baseModeY + row * rowSpacing;
      const label = t('menu.startMode', { mode: t(mode.labelKey) });
      const button = new PrimaryButton(this, x, y, {
        label,
        onClick: () => {
          this.launchGame(mode.id);
        },
      });

      if (mode.id === preferredMode) {
        this.tweens.add({ targets: button, scale: { from: 1.05, to: 1 }, duration: 280 });
      }

      const scoreValue =
        mode.id === 'daily'
          ? dailyHighScore
          : (highScores[mode.id as Exclude<GameMode, 'daily'>] ?? 0);
      const description = this.add
        .text(x, y + descriptionOffset, '', {
          fontFamily: '"Poppins", "Segoe UI", sans-serif',
          fontSize: '16px',
          fontStyle: '500',
          color: '#dbeafe',
          align: 'center',
          wordWrap: { width: 260 },
        })
        .setOrigin(0.5);
      description.setShadow(0, 4, 'rgba(15, 23, 42, 0.5)', 8, false, true);
      description.setText(
        `${t(mode.descriptionKey)}\n${t('menu.modeBestScore', { score: scoreValue })}`,
      );
    });

    if (preferredMode !== 'classic') {
      highScoreText.setText(
        t('menu.bestScoreMode', {
          mode: t(GameConfig.game.modes[preferredMode].labelKey),
          score:
            preferredMode === 'daily'
              ? dailyHighScore
              : (highScores[preferredMode as Exclude<GameMode, 'daily'>] ?? 0),
        }),
      );
    }

    highScoreText.setAlpha(0);
    this.tweens.add({ targets: highScoreText, alpha: 1, duration: 800, delay: 300 });
    [howToButton, languageButton].forEach((button) => {
      this.tweens.add({ targets: button, alpha: { from: 0, to: 1 }, duration: 600, delay: 240 });
    });
  }

  private showInstructions(): void {
    const instructions = t('menu.instructions');

    const modal = this.add.rectangle(400, 300, 640, 260, 0x0f172a, 0.92);
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

  private installAudioUnlock(): void {
    if (this.audioUnlockRegistered || !this.input) {
      return;
    }

    if (!this.sound || !this.sound.locked) {
      return;
    }

    this.audioUnlockRegistered = true;

    const unlock = () => {
      if (this.sound.locked) {
        this.sound.unlock();
      }
      simpleAudio.resume().catch(() => undefined);
    };

    this.input.once('pointerdown', unlock, this);
    this.input.keyboard?.once('keydown', unlock, this);
  }

  private changeLanguage(): void {
    const nextLocale = cycleLocale();
    this.registry.set('locale', nextLocale);
    persistLocalePreference(nextLocale);
    if (typeof document !== 'undefined') {
      document.title = t('app.title');
    }
    this.scene.restart();
  }

  private launchGame(mode: GameMode): void {
    this.registry.set('mode', mode);
    persistModePreference(mode);
    const dailySeed = (this.registry.get('dailySeed') as string) ?? '';
    this.scene.start('Game', { mode, dailySeed });
  }
}

export default MenuScene;
