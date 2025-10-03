import type Phaser from 'phaser';

import { EMOJI_CHARACTERS } from '../core/board/emojiCatalog';

const CARD_SIZE = 96;
const CARD_RADIUS = 18;
const CARD_BACKGROUND = '#ffffff';
const CARD_BORDER = '#d0d7de';

const drawRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void => {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.arcTo(x + width, y, x + width, y + r, r);
  ctx.lineTo(x + width, y + height - r);
  ctx.arcTo(x + width, y + height, x + width - r, y + height, r);
  ctx.lineTo(x + r, y + height);
  ctx.arcTo(x, y + height, x, y + height - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
};

const createCanvas = (width: number, height: number): CanvasRenderingContext2D => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Failed to acquire 2D canvas context.');
  }

  return context;
};

const createBackgroundTexture = (scene: Phaser.Scene): void => {
  const ctx = createCanvas(800, 600);
  const gradient = ctx.createLinearGradient(0, 0, 800, 600);
  gradient.addColorStop(0, '#4facfe');
  gradient.addColorStop(1, '#00f2fe');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 800, 600);

  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  for (let i = 0; i < 60; i += 1) {
    const x = Math.random() * 800;
    const y = Math.random() * 600;
    const radius = Math.random() * 24 + 4;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  scene.textures.addCanvas('background', ctx.canvas);
};

const createLogoTexture = (scene: Phaser.Scene): void => {
  const ctx = createCanvas(460, 170);
  drawRoundedRect(ctx, 10, 10, 440, 150, 24);
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.fill();

  ctx.lineWidth = 4;
  ctx.strokeStyle = '#1f2933';
  ctx.stroke();

  ctx.fillStyle = '#1f2933';
  ctx.font = 'bold 44px "Segoe UI Emoji", "Apple Color Emoji", Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Emoji Match', 230, 70);

  ctx.font = '22px "Segoe UI", Arial';
  ctx.fillStyle = '#3a506b';
  ctx.fillText('Find all of the matching pairs!', 230, 110);

  scene.textures.addCanvas('logo', ctx.canvas);
};

const createCardBackTexture = (scene: Phaser.Scene): void => {
  const ctx = createCanvas(CARD_SIZE, CARD_SIZE);
  const gradient = ctx.createLinearGradient(0, 0, CARD_SIZE, CARD_SIZE);
  gradient.addColorStop(0, '#2563eb');
  gradient.addColorStop(1, '#38bdf8');

  drawRoundedRect(ctx, 4, 4, CARD_SIZE - 8, CARD_SIZE - 8, CARD_RADIUS);
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.stroke();

  ctx.font = '48px "Segoe UI Emoji", "Apple Color Emoji", Arial';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('🎮', CARD_SIZE / 2, CARD_SIZE / 2 + 6);

  scene.textures.addCanvas('card-back', ctx.canvas);
};

const createEmojiAtlas = (scene: Phaser.Scene): void => {
  const columns = Math.ceil(Math.sqrt(EMOJI_CHARACTERS.length));
  const rows = Math.ceil(EMOJI_CHARACTERS.length / columns);
  const atlasWidth = columns * CARD_SIZE;
  const atlasHeight = rows * CARD_SIZE;
  const ctx = createCanvas(atlasWidth, atlasHeight);

  EMOJI_CHARACTERS.forEach((emoji, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const offsetX = column * CARD_SIZE;
    const offsetY = row * CARD_SIZE;

    drawRoundedRect(ctx, offsetX + 4, offsetY + 4, CARD_SIZE - 8, CARD_SIZE - 8, CARD_RADIUS);
    ctx.fillStyle = CARD_BACKGROUND;
    ctx.fill();

    ctx.lineWidth = 2;
    ctx.strokeStyle = CARD_BORDER;
    ctx.stroke();

    ctx.fillStyle = '#1f2933';
    ctx.font = '52px "Segoe UI Emoji", "Apple Color Emoji", Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, offsetX + CARD_SIZE / 2, offsetY + CARD_SIZE / 2 + 2);
  });

  const texture = scene.textures.addCanvas('emoji-atlas', ctx.canvas);
  EMOJI_CHARACTERS.forEach((_, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    texture.add(`emoji-${index}`, 0, column * CARD_SIZE, row * CARD_SIZE, CARD_SIZE, CARD_SIZE);
  });
  texture.refresh();
};

export const createGeneratedAssets = (scene: Phaser.Scene): void => {
  createBackgroundTexture(scene);
  createLogoTexture(scene);
  createCardBackTexture(scene);
  createEmojiAtlas(scene);
};

export default createGeneratedAssets;
