import Phaser from 'phaser';

import { createGeneratedAssets } from '../assets/createGeneratedAssets';
import simpleAudio from '../core/audio/SimpleAudio';
import { t } from '../core/locale/Localization';

class PreloaderScene extends Phaser.Scene {
  private progressBar?: Phaser.GameObjects.Graphics;

  private progressBox?: Phaser.GameObjects.Graphics;

  private progressText?: Phaser.GameObjects.Text;

  private progressDimensions?: { width: number; height: number; radius: number };

  private loadComplete?: Promise<void>;

  constructor() {
    super('Preloader');
  }

  public preload(): void {
    this.createProgressUi();

    this.load.on(Phaser.Loader.Events.PROGRESS, this.handleProgress, this);

    this.loadComplete = new Promise((resolve) => {
      const finalize = async () => {
        this.load.off(Phaser.Loader.Events.PROGRESS, this.handleProgress, this);

        try {
          createGeneratedAssets(this);

          try {
            await this.prepareAudio();
          } catch (error) {
            console.warn('Audio preparation failed, continuing without sound resume.', error);
          }
        } catch (error) {
          console.error('Unexpected error while finalizing preload assets.', error);
        } finally {
          this.progressBar?.destroy();
          this.progressBox?.destroy();
          this.progressText?.destroy();

          resolve();
        }
      };

      if (this.load.totalToLoad === 0) {
        finalize();
        return;
      }

      this.load.once(Phaser.Loader.Events.COMPLETE, finalize);
    });
  }

  public create(): void {
    this.loadComplete?.then(() => {
      this.time.delayedCall(150, () => {
        this.scene.start('Menu');
      });
    });
  }

  private createProgressUi(): void {
    const { width, height } = this.scale;
    const boxWidth = Math.min(width * 0.7, 440);
    const boxHeight = Math.max(48, Math.min(height * 0.14, 64));
    const radius = Math.min(20, boxHeight / 2 - 2);
    const left = width / 2 - boxWidth / 2;
    const top = height / 2 - boxHeight / 2;

    this.progressDimensions = { width: boxWidth, height: boxHeight, radius };

    this.progressBox = this.add.graphics();
    this.progressBox.fillStyle(0x0f172a, 0.65);
    this.progressBox.fillRoundedRect(left, top, boxWidth, boxHeight, radius);

    this.progressBar = this.add.graphics();
    this.progressText = this.add
      .text(width / 2, top + boxHeight + 18, t('preloader.loading'), {
        fontFamily: '"Segoe UI", Arial, sans-serif',
        fontSize: boxHeight < 56 ? '18px' : '24px',
        color: '#f8fafc',
      })
      .setOrigin(0.5);
  }

  private handleProgress(value: number): void {
    if (!this.progressBar || !this.progressBox || !this.progressText || !this.progressDimensions) {
      return;
    }

    const { width, height } = this.scale;
    const { width: boxWidth, height: boxHeight, radius } = this.progressDimensions;
    const left = width / 2 - boxWidth / 2;
    const top = height / 2 - boxHeight / 2;
    this.progressBar.clear();
    this.progressBar.fillStyle(0x38bdf8, 1);
    this.progressBar.fillRoundedRect(
      left + 6,
      top + 6,
      (boxWidth - 12) * value,
      boxHeight - 12,
      radius - 4,
    );

    const total = this.load.totalToLoad;
    const complete = this.load.totalComplete;
    const percent = Number.isFinite(value) ? Math.round(value * 100) : 100;
    this.progressText.setText(t('preloader.loadingProgress', { percent, complete, total }));
  }

  private async prepareAudio(): Promise<void> {
    const hasAudio = (this.registry.get('hasAudio') as boolean) ?? false;
    if (!hasAudio) {
      return;
    }

    await simpleAudio.resume();
  }
}

export default PreloaderScene;
