export type EmojiDefinition = {
  id: string;
  char: string;
  label: string;
};

export const EMOJIS: EmojiDefinition[] = [
  { id: 'grinning', char: '😀', label: 'Grinning face' },
  { id: 'smiley', char: '😃', label: 'Smiling face with big eyes' },
  { id: 'smile', char: '😄', label: 'Smiling face with smiling eyes' },
  { id: 'beaming', char: '😁', label: 'Beaming face' },
  { id: 'laughing', char: '😆', label: 'Laughing face' },
  { id: 'sweat-smile', char: '😅', label: 'Smiling face with sweat' },
  { id: 'joy', char: '😂', label: 'Face with tears of joy' },
  { id: 'rofl', char: '🤣', label: 'Rolling on the floor laughing' },
  { id: 'blush', char: '😊', label: 'Smiling face with rosy cheeks' },
  { id: 'halo', char: '😇', label: 'Smiling face with halo' },
  { id: 'slight-smile', char: '🙂', label: 'Slightly smiling face' },
  { id: 'upside-down', char: '🙃', label: 'Upside-down face' },
  { id: 'wink', char: '😉', label: 'Winking face' },
  { id: 'relieved', char: '😌', label: 'Relieved face' },
  { id: 'heart-eyes', char: '😍', label: 'Smiling face with heart eyes' },
  { id: 'party', char: '🥳', label: 'Partying face' },
  { id: 'robot', char: '🤖', label: 'Robot face' },
  { id: 'cat', char: '🐱', label: 'Cat face' },
  { id: 'dog', char: '🐶', label: 'Dog face' },
  { id: 'panda', char: '🐼', label: 'Panda face' },
  { id: 'fox', char: '🦊', label: 'Fox face' },
  { id: 'frog', char: '🐸', label: 'Frog face' },
  { id: 'octopus', char: '🐙', label: 'Octopus' },
  { id: 'pizza', char: '🍕', label: 'Slice of pizza' },
  { id: 'donut', char: '🍩', label: 'Doughnut' },
  { id: 'football', char: '⚽', label: 'Soccer ball' },
  { id: 'basketball', char: '🏀', label: 'Basketball' },
  { id: 'rocket', char: '🚀', label: 'Rocket' },
  { id: 'star', char: '⭐', label: 'Star' },
  { id: 'rainbow', char: '🌈', label: 'Rainbow' },
  { id: 'headphones', char: '🎧', label: 'Headphones' },
  { id: 'dice', char: '🎲', label: 'Game dice' },
];

export const EMOJI_COUNT = EMOJIS.length;

export const getEmojiByIndex = (index: number): EmojiDefinition => {
  if (index < 0 || index >= EMOJIS.length) {
    throw new Error(`Emoji index out of range: ${index}`);
  }
  return EMOJIS[index];
};
