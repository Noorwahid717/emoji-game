import Phaser from 'phaser';

import { GameConfig, type GameMode } from '../config/GameConfig';
import { t } from '../core/locale/Localization';
import PrimaryButton from '../ui/PrimaryButton';

interface GameOverData {
  won: boolean;
  score: number;
  highScore: number;
  matches: number;
  totalPairs: number;
  timeRemaining: number;
  level: number;
  bestStreak: number;
  mode: GameMode;
  moves: number;
  levelsCompleted: number;
  dailySeed?: string;
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
      level: 1,
      bestStreak: 0,
      mode: 'classic',
      moves: 0,
      levelsCompleted: 0,
    };

    this.add.image(this.scale.width / 2, this.scale.height / 2, 'background').setAlpha(0.6);

    const panel = this.add.rectangle(400, 300, 540, 360, 0x0f172a, 0.9);
    panel.setStrokeStyle(4, payload.won ? 0x22c55e : 0xf97316, 0.9);

    const title = payload.won ? t('gameover.win') : t('gameover.lose');
    this.add
      .text(400, 200, title, {
        fontFamily: '"Poppins", "Segoe UI", sans-serif',
        fontSize: '34px',
        fontStyle: '700',
        color: '#f8fafc',
        align: 'center',
      })
      .setOrigin(0.5)
      .setShadow(0, 6, 'rgba(15, 23, 42, 0.6)', 14, false, true);

    const modeLabel = t(GameConfig.game.modes[payload.mode].labelKey);
    const stats = [
      t('gameover.mode', { mode: modeLabel }),
      t('gameover.score', { score: payload.score }),
      t('gameover.pairs', { found: payload.matches, total: payload.totalPairs }),
      t('gameover.levelReached', { level: payload.level }),
      t('gameover.streak', { streak: payload.bestStreak }),
    ];

    if (payload.won && GameConfig.game.modes[payload.mode].timer.enabled) {
      stats.push(t('gameover.timeRemaining', { seconds: payload.timeRemaining }));
    }

    if (!GameConfig.game.modes[payload.mode].timer.enabled) {
      stats.push(t('gameover.moves', { moves: payload.moves }));
    }

    stats.push(t('gameover.levelsCompleted', { count: payload.levelsCompleted }));
    stats.push(t('gameover.best', { score: payload.highScore }));

    this.add
      .text(400, 280, stats.join('\n'), {
        fontFamily: '"Poppins", "Segoe UI", sans-serif',
        fontSize: '22px',
        fontStyle: '500',
        color: '#e2e8f0',
        align: 'center',
        lineSpacing: 10,
      })
      .setOrigin(0.5)
      .setShadow(0, 4, 'rgba(15, 23, 42, 0.55)', 12, false, true);

    new PrimaryButton(this, 400, 380, {
      label: t('gameover.playAgain'),
      onClick: () => {
        this.scene.start('Game', { mode: payload.mode, dailySeed: payload.dailySeed });
      },
      variant: 'primary',
    });

    new PrimaryButton(this, 400, 460, {
      label: t('gameover.menu'),
      onClick: () => {
        this.scene.start('Menu');
      },
      variant: 'secondary',
    });
  }
}

export default GameOverScene;
