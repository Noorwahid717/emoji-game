import Phaser from 'phaser';

import { GameConfig } from './config/GameConfig';
import BootScene from './scenes/BootScene';
import PreloaderScene from './scenes/PreloaderScene';
import MenuScene from './scenes/MenuScene';
import GameScene from './scenes/GameScene';
import GameOverScene from './scenes/GameOverScene';

const config: Phaser.Types.Core.GameConfig = {
  ...GameConfig.phaser,
  scene: [BootScene, PreloaderScene, MenuScene, GameScene, GameOverScene],
};

// eslint-disable-next-line no-new
new Phaser.Game(config);
