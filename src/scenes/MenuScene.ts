import Phaser from 'phaser';

import { GameConfig, type GameMode } from '../config/GameConfig';
import { cycleLocale, getLocale, getLocaleName, t } from '../core/locale/Localization';
import { getMissionStates } from '../core/missions/missions';
import { loadHighScore } from '../core/storage/highScoreStorage';
import { persistLocalePreference, persistModePreference } from '../core/storage/preferencesStorage';
import simpleAudio from '../core/audio/SimpleAudio';
import PrimaryButton from '../ui/PrimaryButton';

class MenuScene extends Phaser.Scene {
  private pointerUnlockHandler?: () => void;

  private accessibleOverlay?: HTMLDivElement;

  private readonly handleResize = (gameSize: Phaser.Structs.Size) => {
    this.cameras.resize(gameSize.width, gameSize.height);
  };

  constructor() {
    super('Menu');
  }

  public create(): void {
    // eslint-disable-next-line no-console
    console.log(this.scene.key); // ✅ fixed: debug scene transitions
    this.add.image(400, 300, 'background').setDepth(0); // ✅ fixed: restore background layering order

    this.registerAudioUnlock();
    this.ensureAccessibleOverlay();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (this.pointerUnlockHandler) {
        this.input?.off('pointerdown', this.pointerUnlockHandler);
        this.pointerUnlockHandler = undefined;
      }
      this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this);
      this.tweens.killAll();
      this.time?.removeAllEvents();
      this.input?.removeAllListeners();
      if (this.accessibleOverlay) {
        this.accessibleOverlay.remove();
        this.accessibleOverlay = undefined;
      }
    });

    const centerX = this.scale.width / 2;

    const logoImage = this.add.image(centerX, -180, 'logo');
    logoImage.setScale(0.82);
    this.tweens.add({ targets: logoImage, y: 92, ease: 'Back.easeOut', duration: 900 });

    const heroContainer = this.add.container(centerX, 224);
    heroContainer.setDepth(6); // ✅ fixed: ensure hero content renders above backdrop

    const heroShadow = this.add.rectangle(0, 22, 660, 232, 0x020617, 0.28);
    heroShadow.setOrigin(0.5);
    heroShadow.setBlendMode(Phaser.BlendModes.MULTIPLY);

    const heroBackground = this.add.rectangle(0, 0, 640, 216, 0x0f172a, 0.64);
    heroBackground.setOrigin(0.5);
    heroBackground.setStrokeStyle(2, 0x38bdf8, 0.38);

    const title = this.add
      .text(0, -66, t('app.title'), {
        fontFamily: '"Poppins", "Segoe UI", sans-serif',
        fontSize: '48px',
        fontStyle: '700',
        color: '#f8fafc',
        align: 'center',
      })
      .setOrigin(0.5);
    title.setShadow(0, 12, 'rgba(15, 23, 42, 0.6)', 20, false, true);

    const subtitle = this.add
      .text(0, -6, t('app.description'), {
        fontFamily: '"Poppins", "Segoe UI", sans-serif',
        fontSize: '20px',
        fontStyle: '500',
        color: '#cbd5f5',
        align: 'center',
        wordWrap: { width: 520 },
      })
      .setOrigin(0.5);
    subtitle.setShadow(0, 8, 'rgba(15, 23, 42, 0.45)', 16, false, true);

    const intro = this.add
      .text(0, 60, t('menu.instructions'), {
        fontFamily: '"Poppins", "Segoe UI", sans-serif',
        fontSize: '16px',
        fontStyle: '500',
        color: '#e2e8f0',
        align: 'center',
        wordWrap: { width: 560 },
      })
      .setOrigin(0.5);
    intro.setShadow(0, 6, 'rgba(15, 23, 42, 0.4)', 12, false, true);

    heroContainer.add([heroShadow, heroBackground, title, subtitle, intro]);

    this.tweens.add({
      targets: heroContainer,
      alpha: { from: 0, to: 1 },
      duration: 600,
      delay: 220,
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

    const statsContainer = this.add.container(centerX, 360);
    statsContainer.setDepth(6); // ✅ fixed: elevate stats above overlay

    const statsBackground = this.add.rectangle(0, 0, 640, 108, 0x0f172a, 0.58);
    statsBackground.setOrigin(0.5);
    statsBackground.setStrokeStyle(2, 0x38bdf8, 0.34);

    const highScoreText = this.add
      .text(0, -12, t('menu.bestScore', { score: highScores.classic }), {
        fontFamily: '"Poppins", "Segoe UI", sans-serif',
        fontSize: '24px',
        fontStyle: '600',
        color: '#f8fafc',
        align: 'center',
      })
      .setOrigin(0.5);
    highScoreText.setShadow(0, 6, 'rgba(15, 23, 42, 0.5)', 12, false, true);

    const missionSummaryLabel =
      missionStates.length > 0
        ? `${t('missions.header')} (${missionStates.length})`
        : t('menu.instructionsTitle');
    const missionSummary = this.add
      .text(0, 30, missionSummaryLabel, {
        fontFamily: '"Poppins", "Segoe UI", sans-serif',
        fontSize: '18px',
        fontStyle: '500',
        color: '#cbd5f5',
        align: 'center',
      })
      .setOrigin(0.5);
    missionSummary.setShadow(0, 4, 'rgba(15, 23, 42, 0.45)', 10, false, true);

    statsContainer.add([statsBackground, highScoreText, missionSummary]);

    const missionPanelHeight = Math.max(120, 84 + missionStates.length * 34);
    const missionContainer = this.add.container(centerX, 360 + missionPanelHeight / 2 + 72);
    missionContainer.setDepth(6); // ✅ fixed: ensure mission panel on top

    const missionShadow = this.add.rectangle(0, 18, 660, missionPanelHeight + 32, 0x020617, 0.26);
    missionShadow.setOrigin(0.5);
    missionShadow.setBlendMode(Phaser.BlendModes.MULTIPLY);

    const missionBackground = this.add.rectangle(0, 0, 640, missionPanelHeight, 0x0f172a, 0.54);
    missionBackground.setOrigin(0.5);
    missionBackground.setStrokeStyle(2, 0x38bdf8, 0.36);

    const missionHeader = this.add
      .text(0, -missionPanelHeight / 2 + 36, t('missions.header'), {
        fontFamily: '"Poppins", "Segoe UI", sans-serif',
        fontSize: '22px',
        fontStyle: '600',
        color: '#f8fafc',
        align: 'center',
      })
      .setOrigin(0.5);
    missionHeader.setShadow(0, 6, 'rgba(15, 23, 42, 0.45)', 12, false, true);

    missionContainer.add([missionShadow, missionBackground, missionHeader]);

    missionStates.forEach((mission, index) => {
      const status = `${mission.progress}/${mission.goal}`;
      const line = this.add
        .text(
          0,
          -missionPanelHeight / 2 + 74 + index * 34,
          `${t(mission.descriptionKey)} — ${status}`,
          {
            fontFamily: '"Poppins", "Segoe UI", sans-serif',
            fontSize: '18px',
            fontStyle: '500',
            color: mission.completed ? '#22c55e' : '#e2e8f0',
            align: 'center',
            wordWrap: { width: 560 },
          },
        )
        .setOrigin(0.5);
      line.setShadow(0, 4, 'rgba(15, 23, 42, 0.5)', 10, false, true);
      missionContainer.add(line);
    });

    const controlsY = missionContainer.y + missionPanelHeight / 2 + 62;
    const howToButton = new PrimaryButton(this, centerX - 150, controlsY, {
      label: t('menu.howToPlay'),
      onClick: () => {
        this.showInstructions();
      },
      variant: 'secondary',
      width: 220,
    });

    const locale = getLocale();
    const languageButton = new PrimaryButton(this, centerX + 150, controlsY, {
      label: t('menu.language', { language: getLocaleName(locale) }),
      onClick: () => {
        this.changeLanguage();
      },
      variant: 'secondary',
      width: 248,
    });
    howToButton.setDepth(120); // ✅ fixed: keep primary controls above overlays
    languageButton.setDepth(120); // ✅ fixed: keep primary controls above overlays

    const modeList = Object.values(GameConfig.game.modes);
    const columns = Math.min(2, modeList.length);
    const columnOffsets = columns === 1 ? [0] : [-170, 170];
    const rowSpacing = 110;
    const baseModeY = controlsY + 94;
    const descriptionOffset = 34;

    modeList.forEach((mode, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const x = centerX + columnOffsets[column];
      const y = baseModeY + row * rowSpacing;
      const label = t('menu.startMode', { mode: t(mode.labelKey) });
      const button = new PrimaryButton(this, x, y, {
        label,
        onClick: () => {
          this.launchGame(mode.id);
        },
        width: 260,
      });
      button.setDepth(120); // ✅ fixed: bring mode buttons forward

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
          fontSize: '15px',
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

    this.tweens.add({
      targets: statsContainer,
      alpha: { from: 0, to: 1 },
      duration: 600,
      delay: 260,
    });
    this.tweens.add({
      targets: missionContainer,
      alpha: { from: 0, to: 1 },
      duration: 600,
      delay: 320,
    });
    [howToButton, languageButton].forEach((button, index) => {
      this.tweens.add({
        targets: button,
        alpha: { from: 0, to: 1 },
        duration: 500,
        delay: 360 + index * 80,
        ease: 'Sine.easeOut',
      });
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

  private registerAudioUnlock(): void {
    if (!this.input) {
      return;
    }

    if (this.pointerUnlockHandler) {
      this.input.off('pointerdown', this.pointerUnlockHandler);
    }

    this.pointerUnlockHandler = () => {
      const context = this.sound?.context;
      if (context && context.state === 'suspended') {
        context.resume().catch(() => undefined);
      }
      if (this.sound?.unlock) {
        this.sound.unlock();
      }
      simpleAudio.resume().catch(() => undefined);
      this.pointerUnlockHandler = undefined;
    };

    this.input.once('pointerdown', this.pointerUnlockHandler, this);
  }

  private ensureAccessibleOverlay(): void {
    if (typeof document === 'undefined') {
      return;
    }

    const root = document.getElementById('game-root');
    if (!root) {
      return;
    }

    if (!this.accessibleOverlay) {
      const overlay = document.createElement('div');
      overlay.classList.add('ui-overlay', 'accessible-menu');
      root.appendChild(overlay);
      this.accessibleOverlay = overlay;
    }

    const overlay = this.accessibleOverlay;
    overlay.innerHTML = '';

    const heading = document.createElement('h1');
    heading.textContent = t('app.title');

    const startButton = document.createElement('button');
    startButton.type = 'button';
    startButton.textContent = t('menu.startMode', {
      mode: t(GameConfig.game.modes.classic.labelKey),
    });

    const locale = getLocale();
    const settingsButton = document.createElement('button');
    settingsButton.type = 'button';
    settingsButton.textContent = t('menu.language', { language: getLocaleName(locale) });

    overlay.append(heading, startButton, settingsButton);
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
    this.scene.stop(this.scene.key); // ✅ fixed: stop scene before switching
    this.scene.start('Game', { mode, dailySeed });
  }
}

export default MenuScene;
