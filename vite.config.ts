import { defineConfig } from 'vite';

type ViteCommand = 'build' | 'serve';

const resolveBase = (command: ViteCommand): string => {
  const explicit = process.env.VITE_BASE_URL ?? process.env.BASE_URL;
  if (explicit && explicit.trim().length > 0) {
    return explicit;
  }

  // GitHub Pages serves projects from a subdirectory, so fall back to a
  // relative base path to avoid absolute "/" asset requests that 404.
  return command === 'build' ? './' : '/';
};

export default defineConfig(({ command }) => ({
  base: resolveBase(command as ViteCommand),
  server: {
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('phaser')) {
              return 'phaser';
            }
            return 'vendor';
          }
          if (id.includes('/src/scenes/')) {
            return 'scenes';
          }
          return undefined;
        },
      },
    },
  },
}));
