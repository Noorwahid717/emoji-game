import Phaser from 'phaser';

import {
  GameConfig,
  type GameMode,
  type LevelDefinition,
  type ModeDefinition,
} from '../config/GameConfig';
import BoardGenerator from '../core/board/BoardGenerator';
import type { CardDefinition } from '../core/board/BoardGenerator';
import simpleAudio from '../core/audio/SimpleAudio';
import { triggerVibration } from '../core/haptics/vibration';
import { createSeededRandom } from '../core/random/seededRandom';
import { t } from '../core/locale/Localization';
import { incrementMission } from '../core/missions/missions';
import { persistHighScore, loadHighScore } from '../core/storage/highScoreStorage';
import {
  persistAudioPreference,
  persistColorBlindPreference,
} from '../core/storage/preferencesStorage';
import Hud from '../ui/Hud';

const COLOR_SCHEMES = {
  standard: {
    focus: 0xfacc15,
    match: 0x22c55e,
    mismatch: 0xef4444,
  },
  colorBlind: {
    focus: 0x0ea5e9,
    match: 0x2563eb,
    mismatch: 0xf59e0b,
  },
} as const;

type ColorScheme = (typeof COLOR_SCHEMES)[keyof typeof COLOR_SCHEMES];

type PowerUpType = 'hint' | 'freeze' | 'shuffle';

type GameSceneData = {
  mode?: GameMode;
  dailySeed?: string;
};

type SlotPosition = {
  x: number;
  y: number;
};

type CardSprite = Phaser.GameObjects.Image & {
  cardId: number;
  faceTextureKey: string;
  faceFrame: string;
  isFaceUp: boolean;
  isMatched: boolean;
  matchId: number;
  focusRing: Phaser.GameObjects.Rectangle;
  cardIndex: number;
};

const DEFAULT_HIGH_SCORES: Record<GameMode, number> = {
  classic: 0,
  zen: 0,
  hard: 0,
  daily: 0,
};

class GameScene extends Phaser.Scene {
  private modeId: GameMode = 'classic';

  private modeConfig: ModeDefinition = GameConfig.game.modes.classic;

  private dailySeed?: string;

  private generator?: BoardGenerator;

  private hud!: Hud;

  private cards: CardSprite[] = [];

  private slotPositions: SlotPosition[] = [];

  private selectedCards: CardSprite[] = [];

  private powerUps: Record<PowerUpType, number> = { hint: 0, freeze: 0, shuffle: 0 };

  private score = 0;

  private matches = 0;

  private remainingTime = 0;

  private timerEvent?: Phaser.Time.TimerEvent;

  private countdownTriggered = false;

  private timerFrozen = false;

  private gameEnded = false;

  private resolving = false;

  private colorBlindMode = false;

  private keyboardIndex = 0;

  private focusedCard?: CardSprite;

  private keyboardListener?: (event: KeyboardEvent) => void;

  private levelNumber = 1;

  private levelTimeBonus = 0;

  private activeLevel?: LevelDefinition;

  private totalPairs = 0;

  private streak = 0;

  private bestStreak = 0;

  private hintsUsedThisLevel = 0;

  private mismatchesThisLevel = 0;

  private moves = 0;

  private perfectBoard = true;

  private totalLevelsCompleted = 0;

  private highScore = 0;

  constructor() {
    super('Game');
  }

  public create(data?: GameSceneData): void {
    this.add.image(this.scale.width / 2, this.scale.height / 2, 'background');

    const providedMode = data?.mode ?? (this.registry.get('mode') as GameMode) ?? 'classic';
    this.modeId = providedMode;
    this.modeConfig = GameConfig.game.modes[this.modeId];
    this.dailySeed =
      this.modeId === 'daily'
        ? data?.dailySeed ?? (this.registry.get('dailySeed') as string)
        : undefined;

    const highScores = (this.registry.get('highscores') as Record<GameMode, number>) ?? {
      ...DEFAULT_HIGH_SCORES,
    };
    this.highScore =
      this.modeId === 'daily'
        ? loadHighScore('daily', this.dailySeed ?? '')
        : highScores[this.modeId] ?? 0;

    const audioMuted = (this.registry.get('audioMuted') as boolean) ?? false;
    const hasAudio = (this.registry.get('hasAudio') as boolean) ?? false;
    this.colorBlindMode = (this.registry.get('colorBlindMode') as boolean) ?? false;

    this.powerUps = {
      hint: this.modeConfig.powerUps.hint,
      freeze: this.modeConfig.powerUps.freeze,
      shuffle: this.modeConfig.powerUps.shuffle,
    };

    this.hud = new Hud(this, {
      highScore: this.highScore,
      audioMuted,
      audioEnabled: hasAudio,
      colorBlindMode: this.colorBlindMode,
      level: this.levelNumber,
      modeLabelKey: this.modeConfig.labelKey,
      timerEnabled: this.modeConfig.timer.enabled,
      timerWarning: this.modeConfig.timer.warningTime,
      powerUps: this.modeConfig.powerUps,
      powerUpCallbacks: {
        hint: () => this.handleHintPowerUp(),
        freeze: () => this.handleFreezePowerUp(),
        shuffle: () => this.handleShufflePowerUp(),
      },
      onToggleAudio: this.handleAudioToggle,
      onToggleColorBlind: this.handleColorBlindToggle,
    });

    this.updatePowerUpHud();
    this.hud.updateScore(this.score);

    this.createRun();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.teardown, this);
  }

  private createRun(): void {
    this.levelNumber = 1;
    this.score = 0;
    this.matches = 0;
    this.bestStreak = 0;
    this.totalLevelsCompleted = 0;
    this.hintsUsedThisLevel = 0;
    this.mismatchesThisLevel = 0;
    this.moves = 0;
    this.perfectBoard = true;
    this.startLevel();
  }

  private startLevel(): void {
    const levelDefinition = this.getLevelDefinition(this.levelNumber);
    if (!levelDefinition) {
      this.handleGameComplete(true);
      return;
    }

    this.activeLevel = levelDefinition;
    this.currentCleanup();

    this.hintsUsedThisLevel = 0;
    this.mismatchesThisLevel = 0;
    this.perfectBoard = true;
    this.matches = 0;
    this.streak = 0;
    this.selectedCards = [];
    this.countdownTriggered = false;
    this.moves = 0;

    this.hud.updateLevel(this.levelNumber);
    this.hud.updateStreak(this.streak, 1);

    if (this.modeConfig.timer.enabled) {
      this.remainingTime = this.getLevelBaseTime(levelDefinition);
      this.levelTimeBonus = this.getLevelTimeBonus(levelDefinition);
      this.hud.updateTimer(Math.floor(this.remainingTime));
      this.startTimer();
    } else {
      this.remainingTime = 0;
      this.levelTimeBonus = 0;
      this.hud.updateMoves(this.moves);
      this.stopTimer();
    }

    this.createBoard(levelDefinition);

    const focusableIndex = this.findNextFocusableIndex(0, 1) ?? 0;
    this.updateKeyboardFocus(focusableIndex);
    this.applyColorScheme();
  }

  private currentCleanup(): void {
    this.stopTimer();
    this.cards.forEach((card) => {
      card.focusRing.destroy();
      card.destroy();
    });
    this.cards = [];
    this.slotPositions = [];
  }

  private getLevelDefinition(level: number): LevelDefinition | undefined {
    const definitions = GameConfig.game.levels;
    if (this.modeId === 'daily') {
      const cap = Math.min(3, definitions.length);
      if (level > cap) {
        return undefined;
      }
      return definitions[level - 1];
    }

    const index = (level - 1) % definitions.length;
    return definitions[index];
  }

  private getLevelBaseTime(level: LevelDefinition): number {
    if (!this.modeConfig.timer.enabled) {
      return 0;
    }
    const loop = Math.floor((this.levelNumber - 1) / GameConfig.game.levels.length);
    const reduction = loop * 5;
    return Math.max(45, level.baseTime - reduction);
  }

  private getLevelTimeBonus(level: LevelDefinition): number {
    if (!this.modeConfig.timer.enabled) {
      return 0;
    }
    const loop = Math.floor((this.levelNumber - 1) / GameConfig.game.levels.length);
    const reduction = loop;
    return Math.max(3, level.timeBonus - reduction);
  }

  private createBoard(level: LevelDefinition): void {
    const { columns, rows } = level.gridSize;
    const layout = GameConfig.game.layout;
    const spacing = layout.cardSpacing;
    const usableWidth = layout.boardMaxWidth - spacing * (columns - 1);
    const usableHeight = layout.boardMaxHeight - spacing * (rows - 1);
    const cellWidth = Math.min(128, Math.floor(usableWidth / columns));
    const cellHeight = Math.min(128, Math.floor(usableHeight / rows));
    const boardWidth = cellWidth * columns + spacing * (columns - 1);
    const startX = (this.scale.width - boardWidth) / 2 + cellWidth / 2;
    const startY = layout.boardTop + cellHeight / 2;

    const randomGenerator =
      this.modeId === 'daily' && this.dailySeed
        ? createSeededRandom(`${this.dailySeed}-${this.levelNumber}`)
        : Math.random;

    this.generator = new BoardGenerator(randomGenerator);
    const pairCount = (columns * rows) / 2;
    const deck = this.generator.generatePairs(pairCount, GameConfig.game.assets.emojiCount);
    this.totalPairs = pairCount;

    this.slotPositions = deck.map((_, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const x = startX + column * (cellWidth + spacing);
      const y = startY + row * (cellHeight + spacing);
      return { x, y };
    });

    this.cards = deck.map((card, index) => this.createCard(card, index, cellWidth, cellHeight));

    this.tweens.add({
      targets: this.cards,
      scale: { from: 0, to: 1 },
      ease: 'Back.easeOut',
      duration: 320,
      delay: this.tweens.stagger(60),
      onUpdate: (_tween, target: Phaser.GameObjects.GameObject) => {
        const sprite = target as CardSprite;
        sprite.focusRing.setPosition(sprite.x, sprite.y);
        sprite.focusRing.setScale(sprite.scaleX, sprite.scaleY);
      },
    });
  }

  private createCard(
    card: CardDefinition,
    index: number,
    cellWidth: number,
    cellHeight: number,
  ): CardSprite {
    const position = this.slotPositions[index];
    const sprite = this.add.image(position.x, position.y, 'card-back') as CardSprite;
    sprite.setDataEnabled();
    sprite.cardId = card.id;
    sprite.faceTextureKey = card.textureKey;
    sprite.faceFrame = card.frame;
    sprite.isFaceUp = false;
    sprite.isMatched = false;
    sprite.matchId = card.matchId;
    sprite.cardIndex = index;
    sprite.setScale(0);
    sprite.setDisplaySize(cellWidth - 10, cellHeight - 10);

    const focusRing = this.add.rectangle(
      position.x,
      position.y,
      cellWidth - 14,
      cellHeight - 14,
      0xffffff,
      0,
    );
    focusRing.setOrigin(0.5);
    focusRing.setStrokeStyle(4, this.getColorScheme().focus, 0.95);
    focusRing.setVisible(false);
    focusRing.setDepth(sprite.depth + 1);
    sprite.focusRing = focusRing;

    sprite.setInteractive({ useHandCursor: true });
    sprite.on('pointerup', () => {
      this.updateFocusForCard(sprite);
      this.handleCardSelected(sprite);
    });
    sprite.on('pointerover', () => {
      this.updateFocusForCard(sprite);
    });

    return sprite;
  }

  private handleCardSelected(card: CardSprite): void {
    if (this.gameEnded || this.resolving) {
      return;
    }

    if (card.isMatched || card.isFaceUp) {
      return;
    }

    if (this.selectedCards.length === 2) {
      return;
    }

    this.flipCard(card, true);
    this.selectedCards.push(card);

    if (this.selectedCards.length === 2) {
      this.resolving = true;
      this.moves += 1;
      if (!this.modeConfig.timer.enabled) {
        this.hud.updateMoves(this.moves);
      }
      this.time.delayedCall(340, () => this.evaluateSelection());
    }
  }

  private evaluateSelection(): void {
    if (this.selectedCards.length < 2) {
      this.resolving = false;
      return;
    }

    const [first, second] = this.selectedCards;
    this.selectedCards = [];

    if (first.matchId === second.matchId) {
      this.handleMatch(first, second);
      this.resolving = false;
    } else {
      this.handleMismatch(first, second);
    }
  }

  private handleMatch(first: CardSprite, second: CardSprite): void {
    first.isMatched = true;
    second.isMatched = true;

    this.streak += 1;
    this.bestStreak = Math.max(this.bestStreak, this.streak);
    const multiplier = 1 + (this.streak - 1) * this.modeConfig.scoring.streakMultiplierStep;
    const points = Math.round(this.modeConfig.scoring.matchPoints * multiplier);
    this.score += points;
    this.matches += 1;
    this.hud.updateScore(this.score);
    this.hud.updateStreak(this.streak, multiplier);

    if (this.modeConfig.timer.enabled) {
      const bonus = Math.max(0, this.levelTimeBonus + (this.streak - 1) * this.modeConfig.timer.streakBonus);
      if (bonus > 0) {
        this.remainingTime += bonus;
        this.hud.updateTimer(Math.floor(this.remainingTime));
        this.hud.showStatus(t('hud.status.timeBonus', { seconds: bonus }));
      }
    }

    const scheme = this.getColorScheme();
    [first, second].forEach((card) => {
      card.setTint(scheme.match);
      card.focusRing.setVisible(false);
      card.disableInteractive();
    });

    triggerVibration(30);

    if (this.canPlayAudio()) {
      simpleAudio.playMatch().catch(() => undefined);
    }

    this.tweens.add({
      targets: [first, second],
      scale: 1.12,
      angle: { from: -4, to: 4 },
      yoyo: true,
      repeat: 1,
      duration: 220,
      onUpdate: (_tween, target: Phaser.GameObjects.GameObject) => {
        const sprite = target as CardSprite;
        sprite.focusRing.setPosition(sprite.x, sprite.y);
        sprite.focusRing.setScale(sprite.scaleX, sprite.scaleY);
      },
    });

    if (this.matches === this.totalPairs) {
      this.handleLevelComplete();
    } else {
      const nextIndex = this.findNextFocusableIndex(this.keyboardIndex, 1);
      if (typeof nextIndex === 'number') {
        this.updateKeyboardFocus(nextIndex);
      }
    }
  }

  private handleMismatch(first: CardSprite, second: CardSprite): void {
    this.score = Math.max(0, this.score - this.modeConfig.scoring.mismatchPenalty);
    this.hud.updateScore(this.score);
    this.streak = 0;
    this.hud.updateStreak(this.streak, 1);
    this.mismatchesThisLevel += 1;
    this.perfectBoard = false;

    if (this.modeConfig.timer.enabled && this.modeConfig.timer.timePenaltyOnMismatch > 0) {
      this.remainingTime = Math.max(0, this.remainingTime - this.modeConfig.timer.timePenaltyOnMismatch);
      this.hud.updateTimer(Math.floor(this.remainingTime));
      this.hud.showStatus(
        t('hud.status.timePenalty', { seconds: this.modeConfig.timer.timePenaltyOnMismatch }),
        '#f87171',
      );
    }

    if (this.canPlayAudio()) {
      simpleAudio.playMismatch().catch(() => undefined);
    }

    triggerVibration([0, 100, 60]);
    this.cameras.main.shake(160, 0.0025);

    const scheme = this.getColorScheme();
    this.tweens.add({
      targets: [first, second],
      tint: scheme.mismatch,
      duration: 200,
      yoyo: true,
      onComplete: () => {
        first.clearTint();
        second.clearTint();
        this.flipCard(first, false);
        this.flipCard(second, false);
        this.resolving = false;
      },
    });
  }

  private handleLevelComplete(): void {
    this.totalLevelsCompleted += 1;
    this.stopTimer();
    this.streak = 0;
    this.hud.updateStreak(this.streak, 1);

    let bonus = this.modeConfig.scoring.completionBonus;
    if (this.perfectBoard) {
      bonus += this.modeConfig.scoring.perfectBonus;
      this.launchConfetti();
      this.hud.showStatus(t('hud.status.perfect'), '#a7f3d0');
    } else {
      this.hud.showStatus(t('hud.status.levelClear', { level: this.levelNumber }), '#bbf7d0');
    }
    this.score += bonus;
    this.hud.updateScore(this.score);

    if (this.hintsUsedThisLevel === 0) {
      incrementMission('daily-no-hint-level');
      incrementMission('weekly-no-hint-levels');
    }
    if (this.bestStreak >= 5) {
      incrementMission('daily-streak');
    }

    this.levelNumber += 1;
    const hasNextLevel = Boolean(this.getLevelDefinition(this.levelNumber));
    if (hasNextLevel) {
      this.time.delayedCall(800, () => this.startLevel());
    } else {
      this.time.delayedCall(800, () => this.handleGameComplete(true));
    }
  }

  private flipCard(card: CardSprite, faceUp: boolean): void {
    const targetTexture = faceUp ? card.faceTextureKey : 'card-back';
    const targetFrame = faceUp ? card.faceFrame : undefined;
    this.tweens.add({
      targets: card,
      scaleX: 0,
      duration: 100,
      onUpdate: () => {
        card.focusRing.setScale(card.scaleX, card.scaleY);
      },
      onComplete: () => {
        if (faceUp) {
          card.setTexture(targetTexture, targetFrame);
        } else {
          card.setTexture(targetTexture);
          if (!card.isMatched) {
            card.clearTint();
          }
        }
        card.scaleX = 0;
        this.tweens.add({
          targets: card,
          scaleX: 1,
          duration: 100,
          onUpdate: () => {
            card.focusRing.setScale(card.scaleX, card.scaleY);
          },
          onComplete: () => {
            card.focusRing.setPosition(card.x, card.y);
          },
        });
      },
    });

    card.isFaceUp = faceUp;
  }

  private startTimer(): void {
    this.stopTimer();
    if (!this.modeConfig.timer.enabled) {
      return;
    }
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: this.tickTimer,
      callbackScope: this,
    });
  }

  private tickTimer(): void {
    if (this.timerFrozen) {
      return;
    }

    this.remainingTime -= 1;
    this.hud.updateTimer(Math.floor(this.remainingTime));

    if (!this.countdownTriggered && this.remainingTime <= this.modeConfig.timer.warningTime) {
      this.countdownTriggered = true;
      if (this.canPlayAudio()) {
        simpleAudio.playCountdown().catch(() => undefined);
      }
    }

    if (this.remainingTime <= 0) {
      this.handleGameComplete(false);
    }
  }

  private stopTimer(): void {
    this.timerEvent?.remove(false);
    this.timerEvent = undefined;
  }

  private handleGameComplete(won: boolean): void {
    if (this.gameEnded) {
      return;
    }
    this.gameEnded = true;
    this.stopTimer();

    const highScores = (this.registry.get('highscores') as Record<GameMode, number>) ?? {
      ...DEFAULT_HIGH_SCORES,
    };

    const newHighScore = Math.max(this.highScore, this.score);
    if (this.modeId === 'daily') {
      persistHighScore('daily', this.score, this.dailySeed);
    } else {
      persistHighScore(this.modeId, this.score);
      highScores[this.modeId] = newHighScore;
      this.registry.set('highscores', highScores);
    }

    if (newHighScore > this.highScore) {
      this.highScore = newHighScore;
      this.hud.updateHighScore(this.highScore);
    }

    const completedLevel = won ? Math.max(1, this.levelNumber - 1) : Math.max(1, this.levelNumber);

    this.time.delayedCall(600, () => {
      this.scene.start('GameOver', {
        won,
        score: this.score,
        highScore: newHighScore,
        matches: this.matches,
        totalPairs: this.totalPairs,
        timeRemaining: Math.max(0, Math.floor(this.remainingTime)),
        level: completedLevel,
        bestStreak: this.bestStreak,
        mode: this.modeId,
        moves: this.moves,
        levelsCompleted: this.totalLevelsCompleted,
        dailySeed: this.dailySeed,
      });
    });
  }

  private canPlayAudio(): boolean {
    const hasAudio = (this.registry.get('hasAudio') as boolean) ?? false;
    const muted = (this.registry.get('audioMuted') as boolean) ?? false;
    return hasAudio && !muted;
  }

  private getColorScheme(): ColorScheme {
    return this.colorBlindMode ? COLOR_SCHEMES.colorBlind : COLOR_SCHEMES.standard;
  }

  private applyColorScheme(): void {
    const scheme = this.getColorScheme();
    this.cards.forEach((card) => {
      if (card.isMatched) {
        card.setTint(scheme.match);
      } else if (!card.isFaceUp) {
        card.clearTint();
      }
      if (card.focusRing.visible) {
        card.focusRing.setStrokeStyle(4, scheme.focus, 0.95);
      }
    });
  }

  private enableKeyboardNavigation(): void {
    if (!this.input.keyboard) {
      return;
    }

    this.keyboardListener = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'ArrowRight':
        case 'KeyD':
          event.preventDefault();
          this.moveFocus(1);
          break;
        case 'ArrowLeft':
        case 'KeyA':
          event.preventDefault();
          this.moveFocus(-1);
          break;
        case 'ArrowUp':
        case 'KeyW':
          event.preventDefault();
          this.moveFocus(-this.currentRowLength());
          break;
        case 'ArrowDown':
        case 'KeyS':
          event.preventDefault();
          this.moveFocus(this.currentRowLength());
          break;
        case 'Enter':
        case 'Space':
        case 'NumpadEnter':
          event.preventDefault();
          this.selectFocusedCard();
          break;
        default:
          break;
      }
    };

    this.input.keyboard.on('keydown', this.keyboardListener, this);
  }

  private currentRowLength(): number {
    const levelDefinition = this.activeLevel ?? GameConfig.game.levels[0];
    return levelDefinition.gridSize.columns;
  }

  private moveFocus(delta: number): void {
    if (this.cards.length === 0) {
      return;
    }

    const nextIndex = this.findNextFocusableIndex(this.keyboardIndex + delta, Math.sign(delta));
    if (typeof nextIndex === 'number') {
      this.updateKeyboardFocus(nextIndex);
    }
  }

  private findNextFocusableIndex(startIndex: number, direction: number): number | undefined {
    if (this.cards.length === 0) {
      return undefined;
    }

    const total = this.cards.length;
    let index = ((startIndex % total) + total) % total;
    let attempts = 0;

    while (attempts < total) {
      const card = this.cards[index];
      if (card && !card.isMatched) {
        return index;
      }
      index = ((index + direction) % total + total) % total;
      attempts += 1;
    }

    return undefined;
  }

  private updateKeyboardFocus(index: number): void {
    const card = this.cards[index];
    if (!card) {
      return;
    }

    this.keyboardIndex = index;
    this.updateFocusForCard(card);
  }

  private updateFocusForCard(card: CardSprite): void {
    if (card.isMatched) {
      return;
    }

    if (this.focusedCard && this.focusedCard !== card) {
      this.focusedCard.focusRing.setVisible(false);
    }

    this.focusedCard = card;
    const scheme = this.getColorScheme();
    card.focusRing.setStrokeStyle(4, scheme.focus, 0.95);
    card.focusRing.setVisible(true);
    card.focusRing.setPosition(card.x, card.y);
    card.focusRing.setScale(card.scaleX, card.scaleY);
    this.keyboardIndex = card.cardIndex;
  }

  private selectFocusedCard(): void {
    if (!this.focusedCard) {
      return;
    }

    this.handleCardSelected(this.focusedCard);
  }

  private handleHintPowerUp(): void {
    if (this.gameEnded || this.resolving || this.powerUps.hint <= 0) {
      return;
    }

    this.powerUps.hint = Math.max(0, this.powerUps.hint - 1);

    const pair = this.findHintPair();
    if (!pair) {
      this.powerUps.hint += 1;
      this.hud.updatePowerUpCount('hint', this.powerUps.hint);
      this.hud.showStatus(t('hud.status.noHint'), '#facc15');
      return;
    }

    this.hud.updatePowerUpCount('hint', this.powerUps.hint);

    this.resolving = true;
    this.hintsUsedThisLevel += 1;
    this.hud.showStatus(t('hud.status.hint'), '#fef08a');

    pair.forEach((card) => {
      card.disableInteractive();
      if (!card.isFaceUp) {
        this.flipCard(card, true);
      }
      card.setData('hintPeek', true);
    });

    this.time.delayedCall(1200, () => {
      pair.forEach((card) => {
        card.setData('hintPeek', false);
        if (!card.isMatched && card.isFaceUp) {
          this.flipCard(card, false);
        }
        if (!card.isMatched) {
          card.setInteractive({ useHandCursor: true });
        }
      });
      this.resolving = false;
    });
  }

  private handleFreezePowerUp(): void {
    if (this.powerUps.freeze <= 0) {
      return;
    }

    this.powerUps.freeze = Math.max(0, this.powerUps.freeze - 1);

    if (!this.modeConfig.timer.enabled || this.timerFrozen || !this.timerEvent) {
      this.powerUps.freeze += 1;
      this.hud.updatePowerUpCount('freeze', this.powerUps.freeze);
      return;
    }

    this.hud.updatePowerUpCount('freeze', this.powerUps.freeze);

    this.timerFrozen = true;
    this.hud.showStatus(t('hud.status.freeze'), '#bae6fd');
    this.time.delayedCall(this.modeConfig.timer.freezeDuration * 1000, () => {
      this.timerFrozen = false;
    });
  }

  private handleShufflePowerUp(): void {
    if (this.powerUps.shuffle <= 0) {
      return;
    }

    this.powerUps.shuffle = Math.max(0, this.powerUps.shuffle - 1);

    const unmatchedCards = this.cards.filter((card) => !card.isMatched);
    if (unmatchedCards.length <= 1) {
      this.powerUps.shuffle += 1;
      this.hud.updatePowerUpCount('shuffle', this.powerUps.shuffle);
      this.hud.showStatus(t('hud.status.noShuffle'), '#facc15');
      return;
    }

    this.hud.updatePowerUpCount('shuffle', this.powerUps.shuffle);

    const slotIndexes = unmatchedCards.map((card) => card.cardIndex);
    const shuffledSlots = Phaser.Utils.Array.Shuffle([...slotIndexes]);

    unmatchedCards.forEach((card, index) => {
      const slotIndex = shuffledSlots[index];
      const target = this.slotPositions[slotIndex];
      card.cardIndex = slotIndex;
      this.tweens.add({
        targets: card,
        x: target.x,
        y: target.y,
        duration: 280,
        ease: 'Sine.easeInOut',
        onUpdate: () => {
          card.focusRing.setPosition(card.x, card.y);
        },
      });
    });

    this.cards.sort((a, b) => a.cardIndex - b.cardIndex);
    this.hud.showStatus(t('hud.status.shuffle'), '#bfdbfe');
  }

  private findHintPair(): CardSprite[] | undefined {
    const unmatched = this.cards.filter((card) => !card.isMatched && !card.getData('hintPeek'));
    const grouped = new Map<number, CardSprite[]>();
    unmatched.forEach((card) => {
      if (card.isFaceUp) {
        return;
      }
      const group = grouped.get(card.matchId) ?? [];
      group.push(card);
      grouped.set(card.matchId, group);
    });

    const candidate = Array.from(grouped.values()).find((group) => group.length >= 2);
    if (!candidate) {
      return undefined;
    }

    return candidate.slice(0, 2);
  }

  private updatePowerUpHud(): void {
    this.hud.updatePowerUpCount('hint', this.powerUps.hint);
    this.hud.updatePowerUpCount('freeze', this.powerUps.freeze);
    this.hud.updatePowerUpCount('shuffle', this.powerUps.shuffle);
  }

  private launchConfetti(): void {
    const colors = [0xfacc15, 0x38bdf8, 0x34d399, 0xf97316];
    for (let i = 0; i < 12; i += 1) {
      const x = this.scale.width / 2 + Phaser.Math.Between(-160, 160);
      const y = this.scale.height / 2 + Phaser.Math.Between(-40, 40);
      const confetti = this.add.rectangle(x, y, 12, 18, colors[i % colors.length]);
      confetti.setAlpha(0.9);
      this.tweens.add({
        targets: confetti,
        y: confetti.y - Phaser.Math.Between(120, 220),
        x: confetti.x + Phaser.Math.Between(-80, 80),
        angle: Phaser.Math.Between(-180, 180),
        alpha: 0,
        duration: 900,
        ease: 'Cubic.easeOut',
        onComplete: () => confetti.destroy(),
      });
    }
  }

  private teardown(): void {
    if (this.keyboardListener && this.input.keyboard) {
      this.input.keyboard.off('keydown', this.keyboardListener, this);
    }
  }

  private handleAudioToggle = (muted: boolean): void => {
    simpleAudio.setMuted(muted);
    this.registry.set('audioMuted', muted);
    persistAudioPreference(muted);

    if (!muted) {
      simpleAudio.resume().catch(() => undefined);
    }
  };

  private handleColorBlindToggle = (enabled: boolean): void => {
    this.colorBlindMode = enabled;
    this.registry.set('colorBlindMode', enabled);
    persistColorBlindPreference(enabled);
    this.hud.setColorBlindMode(enabled);
    this.applyColorScheme();
    if (this.focusedCard) {
      this.updateFocusForCard(this.focusedCard);
    }
  };
}

export default GameScene;
