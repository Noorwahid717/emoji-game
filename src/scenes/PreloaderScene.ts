import Phaser from 'phaser';

import { createGeneratedAssets } from '../assets/createGeneratedAssets';
import simpleAudio from '../core/audio/SimpleAudio';

class PreloaderScene extends Phaser.Scene {
  private progressBar?: Phaser.GameObjects.Graphics;

  private progressBox?: Phaser.GameObjects.Graphics;

  private progressText?: Phaser.GameObjects.Text;

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

        createGeneratedAssets(this);
        await this.prepareAudio();

        this.progressBar?.destroy();
        this.progressBox?.destroy();
        this.progressText?.destroy();

        resolve();
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
    this.progressBox = this.add.graphics();
    this.progressBox.fillStyle(0x0f172a, 0.65);
    this.progressBox.fillRoundedRect(width / 2 - 220, height / 2 - 30, 440, 60, 18);

    this.progressBar = this.add.graphics();
    this.progressText = this.add
      .text(width / 2, height / 2 + 48, 'Loading…', {
        fontFamily: '"Segoe UI", Arial, sans-serif',
        fontSize: '24px',
        color: '#f8fafc',
      })
      .setOrigin(0.5);
  }

  private handleProgress(value: number): void {
    if (!this.progressBar || !this.progressBox || !this.progressText) {
      return;
    }

    const { width, height } = this.scale;
    this.progressBar.clear();
    this.progressBar.fillStyle(0x38bdf8, 1);
    this.progressBar.fillRoundedRect(width / 2 - 210, height / 2 - 22, 420 * value, 44, 14);

    const total = this.load.totalToLoad;
    const complete = this.load.totalComplete;
    const percent = Number.isFinite(value) ? Math.round(value * 100) : 100;
    this.progressText.setText(`Loading ${percent}% (${complete}/${total})`);
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
