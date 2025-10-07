import Phaser from 'phaser';

import matchAudioUrl from '../assets/audio/match.wav?url';
import mismatchAudioUrl from '../assets/audio/mismatch.wav?url';
import successAudioUrl from '../assets/audio/success.wav?url';
import countdownAudioUrl from '../assets/audio/countdown.wav?url';
import backgroundUrl from '../assets/images/background.png?url';
import cardBackUrl from '../assets/images/card-back.png?url';
import cardFrontUrl from '../assets/images/card-front.png?url';
import emojiAtlasImageUrl from '../assets/images/emoji-atlas.png?url';
import emojiAtlasDataUrl from '../assets/images/emoji-atlas.json?url';
import logoUrl from '../assets/images/logo.png?url';
import simpleAudio from '../core/audio/SimpleAudio';
import { t } from '../core/locale/Localization';

const AUDIO_BINARY_KEYS = [
  { cacheKey: 'audio-match', decodeKey: 'match', url: matchAudioUrl },
  { cacheKey: 'audio-mismatch', decodeKey: 'mismatch', url: mismatchAudioUrl },
  { cacheKey: 'audio-success', decodeKey: 'success', url: successAudioUrl },
  { cacheKey: 'audio-countdown', decodeKey: 'countdown', url: countdownAudioUrl },
] as const;

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
    this.queueAssets();

    this.load.on(Phaser.Loader.Events.PROGRESS, this.handleProgress, this);

    this.loadComplete = new Promise((resolve) => {
      const finalize = async () => {
        this.load.off(Phaser.Loader.Events.PROGRESS, this.handleProgress, this);
        try {
          await this.prepareAudioBuffers();
        } catch (error) {
          console.warn('Audio buffers failed to prepare; continuing without decoded audio.', error);
        } finally {
          this.progressBar?.destroy();
          this.progressBox?.destroy();
          this.progressText?.destroy();
          resolve();
        }
      };

      if (this.load.totalToLoad === 0) {
        finalize().catch(() => undefined);
        return;
      }

      this.load.once(Phaser.Loader.Events.COMPLETE, () => {
        finalize().catch(() => undefined);
      });
    });
  }

  public create(): void {
    this.loadComplete?.then(() => {
      this.time.delayedCall(150, () => {
        this.scene.start('Menu');
      });
    });
  }

  private queueAssets(): void {
    this.load.setCORS('anonymous');
    this.load.image('background', backgroundUrl);
    this.load.image('card-back', cardBackUrl);
    this.load.image('card-front', cardFrontUrl);
    this.load.image('logo', logoUrl);
    this.load.atlas('emoji-atlas', emojiAtlasImageUrl, emojiAtlasDataUrl);
    AUDIO_BINARY_KEYS.forEach(({ cacheKey, url }) => {
      this.load.binary(cacheKey, url);
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

  private async prepareAudioBuffers(): Promise<void> {
    const hasAudio = (this.registry.get('hasAudio') as boolean) ?? false;
    if (!hasAudio) {
      AUDIO_BINARY_KEYS.forEach(({ cacheKey }) => {
        this.cache.binary.remove(cacheKey);
      });
      return;
    }

    const muted = (this.registry.get('audioMuted') as boolean) ?? false;
    const decodePromises = AUDIO_BINARY_KEYS.map(async ({ cacheKey, decodeKey }) => {
      const buffer = this.cache.binary.get(cacheKey);
      if (buffer instanceof ArrayBuffer) {
        await simpleAudio.decode(decodeKey, buffer);
      }
      this.cache.binary.remove(cacheKey);
    });

    await Promise.all(decodePromises);

    simpleAudio.setMuted(muted);
    if (!muted) {
      await simpleAudio.resume();
    }
  }
}

export default PreloaderScene;
