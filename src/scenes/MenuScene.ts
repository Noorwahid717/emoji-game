import Phaser from 'phaser';

import { GameConfig } from '../config/GameConfig';
import { cycleLocale, getLocale, getLocaleName, t } from '../core/locale/Localization';
import { persistLocalePreference } from '../core/storage/preferencesStorage';
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

    const highScore = this.registry.get('highscore') as number;
    const statsText = this.add
      .text(this.scale.width / 2, 300, t('menu.bestScore', { score: highScore }), {
        fontFamily: '"Segoe UI", Arial, sans-serif',
        fontSize: '24px',
        color: '#ffffff',
        stroke: '#0f172a',
        strokeThickness: 4,
        padding: { left: 10, right: 10, top: 6, bottom: 6 },
        backgroundColor: 'rgba(15,23,42,0.45)',
      })
      .setOrigin(0.5);

    new PrimaryButton(this, this.scale.width / 2, 380, {
      label: t('menu.start'),
      onClick: () => {
        this.scene.start('Game', { grid: GameConfig.game.gridSize });
      },
    });

    new PrimaryButton(this, this.scale.width / 2, 460, {
      label: t('menu.howToPlay'),
      onClick: () => {
        this.showInstructions();
      },
    });

    const locale = getLocale();
    new PrimaryButton(this, this.scale.width / 2, 540, {
      label: t('menu.language', { language: getLocaleName(locale) }),
      onClick: () => {
        this.changeLanguage();
      },
    });

    statsText.setAlpha(0);
    this.tweens.add({ targets: statsText, alpha: 1, duration: 800, delay: 300 });
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
}

export default MenuScene;
