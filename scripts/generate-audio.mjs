import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const audioDir = join(__dirname, '..', 'src', 'assets', 'audio');
mkdirSync(audioDir, { recursive: true });

const sampleRate = 44100;
const bytesPerSample = 2;
const channels = 1;
const blockAlign = channels * bytesPerSample;

const envelopeValue = (index, total) => {
  const attackSamples = Math.max(1, Math.round(total * 0.05));
  const attack = Math.min(1, index / attackSamples);
  const release = Math.min(1, (total - index - 1) / attackSamples);
  return Math.min(attack, release);
};

const createSamples = (tones) => {
  const samples = [];
  for (const tone of tones) {
    const frequency = Number(tone.frequency);
    const duration = Number(tone.duration);
    const volume = tone.volume !== undefined ? Number(tone.volume) : 0.3;
    const totalSamples = Math.max(1, Math.round(duration * sampleRate));
    for (let i = 0; i < totalSamples; i += 1) {
      const phase = (2 * Math.PI * frequency * i) / sampleRate;
      const amplitude = Math.sin(phase);
      const env = envelopeValue(i, totalSamples);
      const value = Math.round(32767 * volume * amplitude * env);
      samples.push(Math.max(-32768, Math.min(32767, value)));
    }
  }
  return samples;
};

const writeWaveFile = (filename, tones) => {
  const samples = createSamples(tones);
  const dataSize = samples.length * blockAlign;
  const riffSize = 36 + dataSize;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(riffSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * blockAlign, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bytesPerSample * 8, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < samples.length; i += 1) {
    buffer.writeInt16LE(samples[i], 44 + i * 2);
  }

  writeFileSync(join(audioDir, filename), buffer);
};

writeWaveFile('match.wav', [
  { frequency: 660, duration: 0.18, volume: 0.35 },
]);

writeWaveFile('mismatch.wav', [
  { frequency: 330, duration: 0.16, volume: 0.28 },
  { frequency: 210, duration: 0.22, volume: 0.24 },
]);

writeWaveFile('success.wav', [
  { frequency: 440, duration: 0.12, volume: 0.3 },
  { frequency: 560, duration: 0.12, volume: 0.32 },
  { frequency: 720, duration: 0.18, volume: 0.34 },
]);

writeWaveFile('countdown.wav', [
  { frequency: 220, duration: 0.3, volume: 0.3 },
]);
