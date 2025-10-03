import Phaser from 'phaser';

import { GameConfig, type GameMode } from '../config/GameConfig';
import { cycleLocale, getLocale, getLocaleName, t } from '../core/locale/Localization';
import { getMissionStates } from '../core/missions/missions';
import { loadHighScore } from '../core/storage/highScoreStorage';
import { persistLocalePreference, persistModePreference } from '../core/storage/preferencesStorage';
import PrimaryButton from '../ui/PrimaryButton';

class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  public create(): void {
    this.add.image(400, 300, 'background');

    const logoImage = this.add.image(this.scale.width / 2, -160, 'logo');
    this.tweens.add({ targets: logoImage, y: 160, ease: 'Back.easeOut', duration: 900 });

    const title = this.add
      .text(this.scale.width / 2, 140, t('app.title'), {
        fontFamily: '"Segoe UI", Arial, sans-serif',
        fontSize: '42px',
        color: '#0f172a',
        stroke: '#f8fafc',
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    const subtitle = this.add
      .text(this.scale.width / 2, 200, t('app.description'), {
        fontFamily: '"Segoe UI", Arial, sans-serif',
        fontSize: '24px',
        color: '#0f172a',
        backgroundColor: 'rgba(248,250,252,0.75)',
        padding: { left: 12, right: 12, top: 6, bottom: 6 },
      })
      .setOrigin(0.5);

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
      .text(this.scale.width / 2, 260, t('menu.bestScore', { score: highScores.classic }), {
        fontFamily: '"Segoe UI", Arial, sans-serif',
        fontSize: '24px',
        color: '#ffffff',
        stroke: '#0f172a',
        strokeThickness: 4,
        padding: { left: 10, right: 10, top: 6, bottom: 6 },
        backgroundColor: 'rgba(15,23,42,0.45)',
      })
      .setOrigin(0.5);

    const missionHeader = this.add
      .text(this.scale.width / 2, 310, t('missions.header'), {
        fontFamily: '"Segoe UI", Arial, sans-serif',
        fontSize: '22px',
        color: '#0f172a',
        backgroundColor: 'rgba(248,250,252,0.75)',
        padding: { left: 12, right: 12, top: 6, bottom: 6 },
      })
      .setOrigin(0.5);

    missionStates.forEach((mission, index) => {
      const status = `${mission.progress}/${mission.goal}`;
      const line = this.add.text(
        this.scale.width / 2,
        missionHeader.y + 34 + index * 24,
        `${t(mission.descriptionKey)} — ${status}`,
        {
          fontFamily: '"Segoe UI", Arial, sans-serif',
          fontSize: '18px',
          color: mission.completed ? '#22c55e' : '#e2e8f0',
          backgroundColor: 'rgba(15,23,42,0.55)',
          padding: { left: 10, right: 10, top: 4, bottom: 4 },
        },
      );
      line.setOrigin(0.5);
    });

    const howToButton = new PrimaryButton(this, this.scale.width / 2 - 160, 440, {
      label: t('menu.howToPlay'),
      onClick: () => {
        this.showInstructions();
      },
    });

    const locale = getLocale();
    const languageButton = new PrimaryButton(this, this.scale.width / 2 + 160, 440, {
      label: t('menu.language', { language: getLocaleName(locale) }),
      onClick: () => {
        this.changeLanguage();
      },
    });

    const modeList = Object.values(GameConfig.game.modes);
    const columns = Math.min(2, modeList.length);
    const columnOffsets = columns === 1 ? [0] : [-160, 160];
    const rowSpacing = 80;
    const baseModeY = 520;
    const descriptionOffset = 22;

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
          fontFamily: '"Segoe UI", Arial, sans-serif',
          fontSize: '16px',
          color: '#e2e8f0',
          align: 'center',
          wordWrap: { width: 240 },
        })
        .setOrigin(0.5);
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
