// MIT License
// Copyright (c) 2025 - Emoji Match contributors
// See the LICENSE file in the project root for license information.

import Phaser from 'phaser';

import { GameConfig } from './config/GameConfig';
import BootScene from './scenes/BootScene';
import PreloaderScene from './scenes/PreloaderScene';
import MenuScene from './scenes/MenuScene';
import GameScene from './scenes/GameScene';
import GameOverScene from './scenes/GameOverScene';
import './styles/global.css';

const config: Phaser.Types.Core.GameConfig = {
  ...GameConfig.phaser,
  scene: [BootScene, PreloaderScene, MenuScene, GameScene, GameOverScene],
};

// eslint-disable-next-line no-new
new Phaser.Game(config);
