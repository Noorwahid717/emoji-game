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
export const getEmojiTextureKey = getEmojiFrameKey;

export default EMOJI_CHARACTERS;
