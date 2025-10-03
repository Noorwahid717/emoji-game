import Phaser from 'phaser';

import { GameConfig } from '../config/GameConfig';
import BoardGenerator from '../core/board/BoardGenerator';
import type { CardDefinition } from '../core/board/BoardGenerator';
import simpleAudio from '../core/audio/SimpleAudio';
import { triggerVibration } from '../core/haptics/vibration';
import { persistHighScore } from '../core/storage/highScoreStorage';
import {
  persistAudioPreference,
  persistColorBlindPreference,
} from '../core/storage/preferencesStorage';
import Hud from '../ui/Hud';

const { gridSize, gridPosition, cellSize, timer, scoring } = GameConfig.game;

const totalPairs = (gridSize.columns * gridSize.rows) / 2;

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

class GameScene extends Phaser.Scene {
  private readonly generator = new BoardGenerator();

  private cards: CardSprite[] = [];

  private selectedCards: CardSprite[] = [];

  private hud!: Hud;

  private score = 0;

  private matches = 0;

  private remainingTime = timer.duration;

  private timerEvent?: Phaser.Time.TimerEvent;

  private countdownTriggered = false;

  private gameEnded = false;

  private resolving = false;

  private colorBlindMode = false;

  private keyboardIndex = 0;

  private focusedCard?: CardSprite;

  private keyboardListener?: (event: KeyboardEvent) => void;

  constructor() {
    super('Game');
  }

  public create(): void {
    this.add.image(this.scale.width / 2, this.scale.height / 2, 'background');

    this.score = 0;
    this.matches = 0;
    this.remainingTime = timer.duration;
    this.countdownTriggered = false;
    this.gameEnded = false;
    this.resolving = false;
    this.selectedCards = [];
    this.focusedCard = undefined;

    const highScore = this.registry.get('highscore') as number;
    const audioMuted = (this.registry.get('audioMuted') as boolean) ?? false;
    const hasAudio = (this.registry.get('hasAudio') as boolean) ?? false;
    this.colorBlindMode = (this.registry.get('colorBlindMode') as boolean) ?? false;

    this.hud = new Hud(this, {
      highScore,
      audioMuted,
      audioEnabled: hasAudio,
      colorBlindMode: this.colorBlindMode,
      onToggleAudio: this.handleAudioToggle,
      onToggleColorBlind: this.handleColorBlindToggle,
    });
    this.hud.updateHighScore(highScore);
    this.hud.updateScore(this.score);
    this.hud.updateTimer(this.remainingTime);

    this.createBoard();
    this.startTimer();
    this.enableKeyboardNavigation();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.teardown, this);
  }

  private createBoard(): void {
    const deck = this.generator.generatePairs(totalPairs, GameConfig.game.assets.emojiCount);
    this.cards = deck.map((card, index) => this.createCard(card, index));

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

    const focusableIndex = this.findNextFocusableIndex(0, 1) ?? 0;
    this.updateKeyboardFocus(focusableIndex);
    this.applyColorScheme();
  }

  private createCard(card: CardDefinition, index: number): CardSprite {
    const column = index % gridSize.columns;
    const row = Math.floor(index / gridSize.columns);

    const x = gridPosition.x + column * cellSize.width;
    const y = gridPosition.y + row * cellSize.height;

    const sprite = this.add.image(x, y, 'card-back') as CardSprite;
    sprite.setDataEnabled();
    sprite.cardId = card.id;
    sprite.faceTextureKey = card.textureKey;
    sprite.faceFrame = card.frame;
    sprite.isFaceUp = false;
    sprite.isMatched = false;
    sprite.matchId = card.matchId;
    sprite.cardIndex = index;
    sprite.setScale(0);

    const focusRing = this.add.rectangle(x, y, cellSize.width - 10, cellSize.height - 10, 0xffffff, 0);
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
      this.time.delayedCall(340, () => this.evaluateSelection());
    }
  }

  private evaluateSelection(): void {
    if (this.selectedCards.length < 2) {
      return;
    }

    const [first, second] = this.selectedCards;
    this.resolving = true;
    if (first.matchId === second.matchId) {
      this.handleMatch(first, second);
      this.resolving = false;
    } else {
      this.handleMismatch(first, second);
    }

    this.selectedCards = [];
  }

  private handleMatch(first: CardSprite, second: CardSprite): void {
    first.isMatched = true;
    second.isMatched = true;

    const bonus = Math.max(0, this.remainingTime) * scoring.timeBonus;
    this.score += scoring.matchPoints + bonus;
    this.matches += 1;
    this.hud.updateScore(this.score);

    const scheme = this.getColorScheme();
    [first, second].forEach((card) => {
      card.setTint(scheme.match);
      card.focusRing.setVisible(false);
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

    first.disableInteractive();
    second.disableInteractive();

    if (this.matches === totalPairs) {
      this.handleWin();
    } else {
      const nextIndex = this.findNextFocusableIndex(this.keyboardIndex, 1);
      if (typeof nextIndex === 'number') {
        this.updateKeyboardFocus(nextIndex);
      }
    }
  }

  private handleMismatch(first: CardSprite, second: CardSprite): void {
    this.score = Math.max(0, this.score - scoring.mismatchPenalty);
    this.hud.updateScore(this.score);

    if (this.canPlayAudio()) {
      simpleAudio.playMismatch().catch(() => undefined);
    }

    triggerVibration([0, 100, 60]);

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
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: this.tickTimer,
      callbackScope: this,
    });
  }

  private tickTimer(): void {
    this.remainingTime -= 1;
    this.hud.updateTimer(this.remainingTime);

    if (!this.countdownTriggered && this.remainingTime === timer.warningTime) {
      this.countdownTriggered = true;
      if (this.canPlayAudio()) {
        simpleAudio.playCountdown().catch(() => undefined);
      }
    }

    if (this.remainingTime <= 0) {
      this.handleLoss();
    }
  }

  private stopTimer(): void {
    this.timerEvent?.remove(false);
    this.timerEvent = undefined;
  }

  private handleWin(): void {
    this.score += scoring.completionBonus;
    this.hud.updateScore(this.score);
    if (this.canPlayAudio()) {
      simpleAudio.playSuccess().catch(() => undefined);
    }
    triggerVibration([0, 80, 40, 80]);
    this.endGame(true);
  }

  private handleLoss(): void {
    this.endGame(false);
  }

  private endGame(won: boolean): void {
    if (this.gameEnded) {
      return;
    }
    this.gameEnded = true;
    this.stopTimer();

    const highScore = this.registry.get('highscore') as number;
    const newHighScore = Math.max(highScore, this.score);
    if (newHighScore > highScore) {
      this.registry.set('highscore', newHighScore);
      persistHighScore(newHighScore);
    }

    this.time.delayedCall(600, () => {
      this.scene.start('GameOver', {
        won,
        score: this.score,
        highScore: newHighScore,
        matches: this.matches,
        totalPairs,
        timeRemaining: Math.max(0, this.remainingTime),
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
          this.moveFocus(-gridSize.columns);
          break;
        case 'ArrowDown':
        case 'KeyS':
          event.preventDefault();
          this.moveFocus(gridSize.columns);
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
