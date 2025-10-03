import Phaser from 'phaser';

import { GameConfig } from '../config/GameConfig';
import BoardGenerator from '../core/board/BoardGenerator';
import type { CardDefinition } from '../core/board/BoardGenerator';
import simpleAudio from '../core/audio/SimpleAudio';
import { persistHighScore } from '../core/storage/highScoreStorage';
import { persistAudioPreference } from '../core/storage/preferencesStorage';
import Hud from '../ui/Hud';

const { gridSize, gridPosition, cellSize, timer, scoring } = GameConfig.game;

const totalPairs = (gridSize.columns * gridSize.rows) / 2;

type CardSprite = Phaser.GameObjects.Image & {
  cardId: number;
  faceTextureKey: string;
  faceFrame: string;
  isFaceUp: boolean;
  isMatched: boolean;
  matchId: number;
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

    const highScore = this.registry.get('highscore') as number;
    const audioMuted = (this.registry.get('audioMuted') as boolean) ?? false;
    const hasAudio = (this.registry.get('hasAudio') as boolean) ?? false;
    this.hud = new Hud(this, {
      highScore,
      audioMuted,
      audioEnabled: hasAudio,
      onToggleAudio: this.handleAudioToggle,
    });
    this.hud.updateTimer(this.remainingTime);

    this.createBoard();
    this.startTimer();
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
    });
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
    sprite.matchId = card.matchId;
    sprite.isFaceUp = false;
    sprite.isMatched = false;
    sprite.setScale(0);

    sprite.setInteractive({ useHandCursor: true });
    sprite.on('pointerup', () => {
      this.handleCardSelected(sprite);
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
    });

    first.disableInteractive();
    second.disableInteractive();

    if (this.matches === totalPairs) {
      this.handleWin();
    }
  }

  private handleMismatch(first: CardSprite, second: CardSprite): void {
    this.score = Math.max(0, this.score - scoring.mismatchPenalty);
    this.hud.updateScore(this.score);

    if (this.canPlayAudio()) {
      simpleAudio.playMismatch().catch(() => undefined);
    }

    this.tweens.add({
      targets: [first, second],
      tint: 0xff6b6b,
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
      onComplete: () => {
        if (faceUp) {
          card.setTexture(targetTexture, targetFrame);
        } else {
          card.setTexture(targetTexture);
        }
        card.scaleX = 0;
        this.tweens.add({
          targets: card,
          scaleX: 1,
          duration: 100,
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

  private handleAudioToggle = (muted: boolean): void => {
    simpleAudio.setMuted(muted);
    this.registry.set('audioMuted', muted);
    persistAudioPreference(muted);

    if (!muted) {
      simpleAudio.resume().catch(() => undefined);
    }
  };
}

export default GameScene;
