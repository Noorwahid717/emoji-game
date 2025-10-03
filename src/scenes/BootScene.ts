import Phaser from 'phaser';

import simpleAudio from '../core/audio/SimpleAudio';
import { detectLocale, initLocale, t } from '../core/locale/Localization';
import { loadHighScore } from '../core/storage/highScoreStorage';
import {
  loadAudioPreference,
  loadColorBlindPreference,
  loadLocalePreference,
} from '../core/storage/preferencesStorage';
import { resetLiveRegions } from '../ui/accessibility/liveRegions';

class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  public init(): void {
    const highScore = loadHighScore();
    this.registry.set('highscore', highScore);
    const audioMuted = loadAudioPreference();
    this.registry.set('audioMuted', audioMuted);
    const colorBlindMode = loadColorBlindPreference();
    this.registry.set('colorBlindMode', colorBlindMode);

    const savedLocale = loadLocalePreference();
    const locale = savedLocale === 'auto' ? detectLocale() : savedLocale;
    initLocale(locale);
    this.registry.set('locale', locale);

    if (typeof document !== 'undefined') {
      document.title = t('app.title');
      const root = document.getElementById('game-root');
      if (root) {
        root.setAttribute('aria-label', t('app.title'));
      }
    }
    resetLiveRegions();
  }

  public create(): void {
    const hasAudio = simpleAudio.init();
    this.registry.set('simpleAudio', simpleAudio);
    this.registry.set('hasAudio', hasAudio);
    simpleAudio.setMuted((this.registry.get('audioMuted') as boolean) ?? false);

    this.scene.start('Preloader');
  }
}

export default BootScene;
