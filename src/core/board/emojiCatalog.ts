export const EMOJI_CHARACTERS: readonly string[] = [
  '😀',
  '😎',
  '🤖',
  '👾',
  '🐱',
  '🐶',
  '🦊',
  '🦄',
  '🚀',
  '🌟',
  '🎉',
  '🎈',
  '🍕',
  '🍩',
  '🏆',
  '💎',
];

export const getEmojiFrameKey = (index: number): string => `emoji-${index}`;

export default EMOJI_CHARACTERS;
